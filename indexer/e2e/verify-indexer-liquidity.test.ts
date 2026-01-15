import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { USER_0_ADDRESS, USER_1_ADDRESS, USER_2_ADDRESS } from './utils';

const { Client } = pg;

describe('Verify Liquidity', () => {
  let client: pg.Client;
  beforeAll(async () => {
    if (
      !process.env.VITE_DB_USER ||
      !process.env.VITE_DB_PASS ||
      !process.env.VITE_DB_PORT ||
      !process.env.VITE_DB_NAME
    ) {
      throw new Error('Environment variables not set');
    }
    client = new Client({
      user: process.env.VITE_DB_USER,
      password: process.env.VITE_DB_PASS,
      host: 'localhost',
      port: parseInt(process.env.VITE_DB_PORT, 10),
      database: process.env.VITE_DB_NAME,
    });

    await client.connect();
  });

  it('should store correct number of liquidity events', async () => {
    const user0Result = await client.query(
      'SELECT COUNT(*) as c FROM liquidity WHERE account = $1',
      [USER_0_ADDRESS]
    );
    const user0Records = user0Result.rows[0].c;
    expect(user0Records).toBe('4'); // 2 adds + 2 removes

    const user1Result = await client.query(
      'SELECT COUNT(*) as c FROM liquidity WHERE account = $1',
      [USER_1_ADDRESS]
    );
    const user1Records = user1Result.rows[0].c;
    expect(user1Records).toBe('2'); // 1 add + 1 remove

    const user2Result = await client.query(
      'SELECT COUNT(*) as c FROM liquidity WHERE account = $1',
      [USER_2_ADDRESS]
    );
    const user2Records = user2Result.rows[0].c;
    expect(user2Records).toBe('2'); // 2 adds
  });

  it('should store correct latest liquidity for user0', async () => {
    const user0Result = await client.query(
      'SELECT lp_asset_balance, base_asset, lp_asset FROM liquidity WHERE account = $1 AND latest = true',
      [USER_0_ADDRESS]
    );
    expect(user0Result.rows.length).toBe(1);
    // User0 added 10000 + 3000 = 13000, then removed all, so latest lpAssetBalance should be 0
    const latest = user0Result.rows[0];
    expect(latest.lp_asset_balance).toBe('0');
  });

  it('should store correct latest liquidity for user1', async () => {
    const user1Result = await client.query(
      'SELECT lp_asset_balance, base_asset, lp_asset FROM liquidity WHERE account = $1 AND latest = true',
      [USER_1_ADDRESS]
    );
    expect(user1Result.rows.length).toBe(1);
    // User1 added 5000, then removed all, so latest lpAssetBalance should be 0
    const latest = user1Result.rows[0];
    expect(latest.lp_asset_balance).toBe('0');
  });

  it('should store correct latest liquidity for user2', async () => {
    const user2Result = await client.query(
      'SELECT lp_asset_balance, base_asset, lp_asset FROM liquidity WHERE account = $1 AND latest = true',
      [USER_2_ADDRESS]
    );
    expect(user2Result.rows.length).toBe(1);
    const latest = user2Result.rows[0];
    // User2 added 7000 + 2000 = 9000, so latest lpAssetBalance should be around 9000 (minus fees)
    // Note: Due to fees, the exact amount might be slightly less
    const lpAssetBalance = BigInt(latest.lp_asset_balance);
    expect(lpAssetBalance).toBeGreaterThan(0);
  });

  it('should store correct liquidity timestamps', async () => {
    const user0Result = await client.query(
      'SELECT min(timestamp) as min_ts, max(timestamp) as max_ts FROM liquidity WHERE account = $1',
      [USER_0_ADDRESS]
    );
    const user0MinTimestamp = user0Result.rows[0].min_ts;
    const user0MaxTimestamp = user0Result.rows[0].max_ts;
    const now = Math.floor(Date.now() / 1000);

    // Timestamps should be recent
    expect(user0MinTimestamp).toBeLessThan(now + 1800);
    expect(user0MinTimestamp).toBeGreaterThan(now - 1800);
    expect(user0MaxTimestamp).toBeLessThan(now + 1800);
    expect(user0MaxTimestamp).toBeGreaterThan(now - 1800);

    // Timestamps should span across events (at least 5+10+8+12+7+15 = 57 seconds)
    expect(user0MaxTimestamp - user0MinTimestamp).toBeGreaterThanOrEqual(57);
  });

  it('should have only one latest record per account', async () => {
    const user0Latest = await client.query(
      'SELECT COUNT(*) as c FROM liquidity WHERE account = $1 AND latest = true',
      [USER_0_ADDRESS]
    );
    expect(user0Latest.rows[0].c).toBe('1');

    const user1Latest = await client.query(
      'SELECT COUNT(*) as c FROM liquidity WHERE account = $1 AND latest = true',
      [USER_1_ADDRESS]
    );
    expect(user1Latest.rows[0].c).toBe('1');

    const user2Latest = await client.query(
      'SELECT COUNT(*) as c FROM liquidity WHERE account = $1 AND latest = true',
      [USER_2_ADDRESS]
    );
    expect(user2Latest.rows[0].c).toBe('1');
  });

  it('should store correct liquidity progression for user0 with aggregated lpAssetBalance', async () => {
    const user0Result = await client.query(
      'SELECT lp_asset_balance, base_asset, lp_asset, timestamp FROM liquidity WHERE account = $1 ORDER BY timestamp ASC',
      [USER_0_ADDRESS]
    );
    expect(user0Result.rows.length).toBe(4);

    // First add: lpAssetBalance should be positive (aggregated)
    const firstAdd = user0Result.rows[0];
    expect(BigInt(firstAdd.lp_asset_balance)).toBeGreaterThan(0);
    expect(BigInt(firstAdd.base_asset)).toBeGreaterThan(0); // baseAsset delta is positive for add
    expect(BigInt(firstAdd.lp_asset)).toBeGreaterThan(0); // lpAsset delta is positive for add

    // Second add: lpAssetBalance should increase
    const secondAdd = user0Result.rows[1];
    expect(BigInt(secondAdd.lp_asset_balance)).toBeGreaterThan(BigInt(firstAdd.lp_asset_balance));
    expect(BigInt(secondAdd.base_asset)).toBeGreaterThan(0);
    expect(BigInt(secondAdd.lp_asset)).toBeGreaterThan(0);

    // First remove: lpAssetBalance should decrease
    const firstRemove = user0Result.rows[2];
    expect(BigInt(firstRemove.lp_asset_balance)).toBeLessThan(BigInt(secondAdd.lp_asset_balance));
    expect(BigInt(firstRemove.base_asset)).toBeLessThan(0); // baseAsset delta is negative for remove
    expect(BigInt(firstRemove.lp_asset)).toBeLessThan(0); // lpAsset delta is negative for remove

    // Second remove: lpAssetBalance should be 0 (all removed)
    const secondRemove = user0Result.rows[3];
    expect(secondRemove.lp_asset_balance).toBe('0');
    expect(BigInt(secondRemove.base_asset)).toBeLessThan(0);
    expect(BigInt(secondRemove.lp_asset)).toBeLessThan(0);
  });

  describe('API tests', () => {
    function getGraphQLURL() {
      return `http://localhost:${process.env.VITE_GRAPHQL_SERVER_PORT}/graphql`;
    }

    async function graphQLPost(query: string) {
      const response = await fetch(getGraphQLURL(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `query{${query}}`,
        }),
      });
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`GraphQL request failed: ${response.status}: ${responseText}`);
      }
      return response.json();
    }

    it('should store correct number of liquidity events', async () => {
      const user0Data = await graphQLPost(
        `liquidities(condition:{account:"${USER_0_ADDRESS}"}){nodes{id}}`
      );
      expect(user0Data.data.liquidities.nodes.length).toBe(4); // 2 adds + 2 removes

      const user1Data = await graphQLPost(
        `liquidities(condition:{account:"${USER_1_ADDRESS}"}){nodes{id}}`
      );
      expect(user1Data.data.liquidities.nodes.length).toBe(2); // 1 add + 1 remove

      const user2Data = await graphQLPost(
        `liquidities(condition:{account:"${USER_2_ADDRESS}"}){nodes{id}}`
      );
      expect(user2Data.data.liquidities.nodes.length).toBe(2); // 2 adds
    });

    it('should store correct latest liquidity for user0', async () => {
      const user0LatestData = await graphQLPost(
        `liquidities(condition:{account:"${USER_0_ADDRESS}",latest:true}){nodes{lpAssetBalance,baseAsset,lpAsset}}`
      );
      expect(user0LatestData.data.liquidities.nodes.length).toBe(1);
      const latest = user0LatestData.data.liquidities.nodes[0];
      // User0 removed all, so latest lpAssetBalance should be 0
      expect(latest.lpAssetBalance).toBe('0');
    });

    it('should store correct latest liquidity for user1', async () => {
      const user1LatestData = await graphQLPost(
        `liquidities(condition:{account:"${USER_1_ADDRESS}",latest:true}){nodes{lpAssetBalance,baseAsset,lpAsset}}`
      );
      expect(user1LatestData.data.liquidities.nodes.length).toBe(1);
      const latest = user1LatestData.data.liquidities.nodes[0];
      // User1 removed all, so latest lpAssetBalance should be 0
      expect(latest.lpAssetBalance).toBe('0');
    });

    it('should store correct latest liquidity for user2', async () => {
      const user2LatestData = await graphQLPost(
        `liquidities(condition:{account:"${USER_2_ADDRESS}",latest:true}){nodes{lpAssetBalance,baseAsset,lpAsset}}`
      );
      expect(user2LatestData.data.liquidities.nodes.length).toBe(1);
      const latest = user2LatestData.data.liquidities.nodes[0];
      // User2 added 7000 + 2000 = 9000, so latest lpAssetBalance should be positive
      expect(BigInt(latest.lpAssetBalance)).toBeGreaterThan(0);
    });

    it('should store correct liquidity timestamps', async () => {
      const user0Data = await graphQLPost(
        `liquidities(condition:{account:"${USER_0_ADDRESS}"}){nodes{timestamp}}`
      );

      const timestamps = user0Data.data.liquidities.nodes.map(
        (liq: { timestamp: number }) => liq.timestamp
      );
      const minTimestamp = Math.min(...timestamps);
      const maxTimestamp = Math.max(...timestamps);
      const now = Math.floor(Date.now() / 1000);

      // Timestamps should be recent
      expect(minTimestamp).toBeLessThan(now + 1800);
      expect(minTimestamp).toBeGreaterThan(now - 1800);
      expect(maxTimestamp).toBeLessThan(now + 1800);
      expect(maxTimestamp).toBeGreaterThan(now - 1800);

      // Timestamps should span across events (at least 5+10+8+12+7+15 = 57 seconds)
      expect(maxTimestamp - minTimestamp).toBeGreaterThanOrEqual(57);
    });

    it('should have only one latest record per account', async () => {
      const user0LatestData = await graphQLPost(
        `liquidities(condition:{account:"${USER_0_ADDRESS}",latest:true}){nodes{id}}`
      );
      expect(user0LatestData.data.liquidities.nodes.length).toBe(1);

      const user1LatestData = await graphQLPost(
        `liquidities(condition:{account:"${USER_1_ADDRESS}",latest:true}){nodes{id}}`
      );
      expect(user1LatestData.data.liquidities.nodes.length).toBe(1);

      const user2LatestData = await graphQLPost(
        `liquidities(condition:{account:"${USER_2_ADDRESS}",latest:true}){nodes{id}}`
      );
      expect(user2LatestData.data.liquidities.nodes.length).toBe(1);
    });

    it('should store correct liquidity progression for user0 with aggregated lpAssetBalance', async () => {
      const user0Data = await graphQLPost(
        `liquidities(condition:{account:"${USER_0_ADDRESS}"}){nodes{lpAssetBalance,baseAsset,lpAsset,timestamp}}`
      );
      expect(user0Data.data.liquidities.nodes.length).toBe(4);

      // Sort by timestamp ASC
      const sortedLiquidity = user0Data.data.liquidities.nodes.sort(
        (a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp
      );

      // First add: lpAssetBalance should be positive (aggregated)
      const firstAdd = sortedLiquidity[0];
      expect(BigInt(firstAdd.lpAssetBalance)).toBeGreaterThan(0);
      expect(BigInt(firstAdd.baseAsset)).toBeGreaterThan(0); // baseAsset delta is positive for add
      expect(BigInt(firstAdd.lpAsset)).toBeGreaterThan(0); // lpAsset delta is positive for add

      // Second add: lpAssetBalance should increase
      const secondAdd = sortedLiquidity[1];
      expect(BigInt(secondAdd.lpAssetBalance)).toBeGreaterThan(BigInt(firstAdd.lpAssetBalance));
      expect(BigInt(secondAdd.baseAsset)).toBeGreaterThan(0);
      expect(BigInt(secondAdd.lpAsset)).toBeGreaterThan(0);

      // First remove: lpAssetBalance should decrease
      const firstRemove = sortedLiquidity[2];
      expect(BigInt(firstRemove.lpAssetBalance)).toBeLessThan(BigInt(secondAdd.lpAssetBalance));
      expect(BigInt(firstRemove.baseAsset)).toBeLessThan(0); // baseAsset delta is negative for remove
      expect(BigInt(firstRemove.lpAsset)).toBeLessThan(0); // lpAsset delta is negative for remove

      // Second remove: lpAssetBalance should be 0 (all removed)
      const secondRemove = sortedLiquidity[3];
      expect(secondRemove.lpAssetBalance).toBe('0');
      expect(BigInt(secondRemove.baseAsset)).toBeLessThan(0);
      expect(BigInt(secondRemove.lpAsset)).toBeLessThan(0);
    });
  });

  afterAll(async () => {
    await client.end();
  });
});
