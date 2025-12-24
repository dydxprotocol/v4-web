import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { USER_0_ADDRESS, USER_1_ADDRESS, USER_2_ADDRESS, expandDecimals } from './utils';

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
      'SELECT COUNT(*) as c FROM liquidity WHERE provider = $1',
      [USER_0_ADDRESS]
    );
    const user0Records = user0Result.rows[0].c;
    expect(user0Records).toBe('4'); // 2 adds + 2 removes

    const user1Result = await client.query(
      'SELECT COUNT(*) as c FROM liquidity WHERE provider = $1',
      [USER_1_ADDRESS]
    );
    const user1Records = user1Result.rows[0].c;
    expect(user1Records).toBe('2'); // 1 add + 1 remove

    const user2Result = await client.query(
      'SELECT COUNT(*) as c FROM liquidity WHERE provider = $1',
      [USER_2_ADDRESS]
    );
    const user2Records = user2Result.rows[0].c;
    expect(user2Records).toBe('2'); // 2 adds
  });

  it('should store correct latest liquidity for user0', async () => {
    const user0Result = await client.query(
      'SELECT stable, lp_amount FROM liquidity WHERE provider = $1 AND latest = true',
      [USER_0_ADDRESS]
    );
    expect(user0Result.rows.length).toBe(1);
    // User0 added 10000 + 3000 = 13000, then removed all, so latest should be 0
    const user0Result2 = await client.query(
      'SELECT sum(stable) AS stable, sum(lp_amount) AS lp_amount FROM liquidity WHERE provider = $1',
      [USER_0_ADDRESS]
    );
    const user0Liquidity = user0Result2.rows[0];
    expect(user0Liquidity.stable).toBe('0');
    expect(user0Liquidity.lp_amount).toBe('0');
  });

  it('should store correct latest liquidity for user1', async () => {
    const user1Result = await client.query(
      'SELECT stable, lp_amount FROM liquidity WHERE provider = $1 AND latest = true',
      [USER_1_ADDRESS]
    );
    expect(user1Result.rows.length).toBe(1);
    // User1 added 5000, then removed all, so latest should be 0
    const user1Result2 = await client.query(
      'SELECT sum(stable) AS stable, sum(lp_amount) AS lp_amount FROM liquidity WHERE provider = $1',
      [USER_1_ADDRESS]
    );
    const user1Liquidity = user1Result2.rows[0];
    expect(user1Liquidity.stable).toBe('0');
    expect(user1Liquidity.lp_amount).toBe('0');
  });

  it('should store correct latest liquidity for user2', async () => {
    const user2Result = await client.query(
      'SELECT stable, lp_amount FROM liquidity WHERE provider = $1 AND latest = true',
      [USER_2_ADDRESS]
    );
    expect(user2Result.rows.length).toBe(1);
    const user2Result2 = await client.query(
      'SELECT sum(stable) AS stable, sum(lp_amount) AS lp_amount FROM liquidity WHERE provider = $1',
      [USER_2_ADDRESS]
    );
    const user2Liquidity = user2Result2.rows[0];
    // User2 added 7000 + 2000 = 9000, so latest should be around 9000 (minus fees)
    // Note: Due to fees, the exact amount might be slightly less
    const stableAmount = BigInt(user2Liquidity.stable);
    expect(stableAmount).toBeGreaterThan(BigInt(expandDecimals(8500))); // At least 8500 after fees
    expect(stableAmount).toBeLessThanOrEqual(BigInt(expandDecimals(9000)));
    expect(BigInt(user2Liquidity.lp_amount)).toBeGreaterThan(0);
  });

  it('should store correct total liquidity', async () => {
    const totalResult = await client.query(
      'SELECT stable, lp_amount FROM total_liquidity WHERE id = $1',
      ['1']
    );
    expect(totalResult.rows.length).toBe(1);
    const totalLiquidity = totalResult.rows[0];
    // Total should be user2's liquidity (9000 minus fees)
    const stableAmount = BigInt(totalLiquidity.stable);
    expect(stableAmount).toBeGreaterThan(BigInt(expandDecimals(8500)));
    expect(stableAmount).toBeLessThanOrEqual(BigInt(expandDecimals(9000)));
    expect(BigInt(totalLiquidity.lp_amount)).toBeGreaterThan(0);
  });

  it('should have total liquidity match final provider state', async () => {
    // Total liquidity should match user2's final state (only provider with remaining liquidity)
    // Note: Total liquidity calculation differs from summing liquidity records because
    // remove events in liquidity records include fees, but total liquidity subtracts
    // stableDelta without fee on remove
    const user2Result = await client.query(
      'SELECT SUM(stable) AS stable, SUM(lp_amount) AS lp_amount FROM liquidity WHERE provider = $1',
      [USER_2_ADDRESS]
    );
    const totalResult = await client.query(
      'SELECT stable, lp_amount FROM total_liquidity WHERE id = $1',
      ['1']
    );

    const user2Stable = BigInt(user2Result.rows[0].stable);
    const user2Lp = BigInt(user2Result.rows[0].lp_amount);
    const totalStable = BigInt(totalResult.rows[0].stable);
    const totalLp = BigInt(totalResult.rows[0].lp_amount);

    // Since user0 and user1 removed all liquidity, total should match user2's positive values
    // User2's latest is an add event (positive), so total should match
    expect(totalStable).toBe(user2Stable);
    expect(totalLp).toBe(user2Lp);
  });

  it('should store correct total liquidity timestamp', async () => {
    const totalResult = await client.query(
      'SELECT last_timestamp FROM total_liquidity WHERE id = $1',
      ['1']
    );
    expect(totalResult.rows.length).toBe(1);
    const totalTimestamp = totalResult.rows[0].last_timestamp;
    const now = Math.floor(Date.now() / 1000);

    // Timestamp should be recent
    expect(totalTimestamp).toBeLessThan(now + 1800);
    expect(totalTimestamp).toBeGreaterThan(now - 1800);

    // Total liquidity timestamp should match the latest provider liquidity timestamp
    const latestLiquidityResult = await client.query(
      'SELECT max(timestamp) as max_ts FROM liquidity'
    );
    const maxLiquidityTimestamp = latestLiquidityResult.rows[0].max_ts;
    expect(totalTimestamp).toBe(maxLiquidityTimestamp);
  });

  it('should have only one total liquidity record', async () => {
    const totalResult = await client.query('SELECT COUNT(*) as c FROM total_liquidity');
    expect(totalResult.rows[0].c).toBe('1');
  });

  it('should have total liquidity with non-negative values', async () => {
    const totalResult = await client.query(
      'SELECT stable, lp_amount FROM total_liquidity WHERE id = $1',
      ['1']
    );
    const totalLiquidity = totalResult.rows[0];

    expect(BigInt(totalLiquidity.stable)).toBeGreaterThanOrEqual(0);
    expect(BigInt(totalLiquidity.lp_amount)).toBeGreaterThanOrEqual(0);
  });

  it('should store correct liquidity timestamps', async () => {
    const user0Result = await client.query(
      'SELECT min(timestamp) as min_ts, max(timestamp) as max_ts FROM liquidity WHERE provider = $1',
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

  it('should have only one latest record per provider', async () => {
    const user0Latest = await client.query(
      'SELECT COUNT(*) as c FROM liquidity WHERE provider = $1 AND latest = true',
      [USER_0_ADDRESS]
    );
    expect(user0Latest.rows[0].c).toBe('1');

    const user1Latest = await client.query(
      'SELECT COUNT(*) as c FROM liquidity WHERE provider = $1 AND latest = true',
      [USER_1_ADDRESS]
    );
    expect(user1Latest.rows[0].c).toBe('1');

    const user2Latest = await client.query(
      'SELECT COUNT(*) as c FROM liquidity WHERE provider = $1 AND latest = true',
      [USER_2_ADDRESS]
    );
    expect(user2Latest.rows[0].c).toBe('1');
  });

  it('should store correct liquidity progression for user0', async () => {
    const user0Result = await client.query(
      'SELECT stable, lp_amount, timestamp FROM liquidity WHERE provider = $1 ORDER BY timestamp ASC',
      [USER_0_ADDRESS]
    );
    expect(user0Result.rows.length).toBe(4);

    // First add: 10000 USDC (after fees, positive value)
    const firstAdd = user0Result.rows[0];
    expect(BigInt(firstAdd.stable)).toBeGreaterThanOrEqual(BigInt(expandDecimals(9500))); // After fees
    expect(BigInt(firstAdd.stable)).toBeGreaterThan(0); // Positive
    expect(BigInt(firstAdd.lp_amount)).toBeGreaterThan(0); // Positive

    // Second add: 3000 USDC (after fees, positive value, not accumulated)
    const secondAdd = user0Result.rows[1];
    expect(BigInt(secondAdd.stable)).toBeGreaterThanOrEqual(BigInt(expandDecimals(2800))); // After fees
    expect(BigInt(secondAdd.stable)).toBeGreaterThan(0); // Positive
    expect(BigInt(secondAdd.lp_amount)).toBeGreaterThan(0); // Positive

    // First remove: negative value (amount removed)
    const firstRemove = user0Result.rows[2];
    expect(BigInt(firstRemove.stable)).toBeLessThan(0); // Negative
    expect(BigInt(firstRemove.lp_amount)).toBeLessThan(0); // Negative

    // Second remove: negative value (amount removed)
    const secondRemove = user0Result.rows[3];
    expect(BigInt(secondRemove.stable)).toBeLessThan(0); // Negative
    expect(BigInt(secondRemove.lp_amount)).toBeLessThan(0); // Negative
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
        `liquidities(condition:{provider:"${USER_0_ADDRESS}"}){nodes{id}}`
      );
      expect(user0Data.data.liquidities.nodes.length).toBe(4); // 2 adds + 2 removes

      const user1Data = await graphQLPost(
        `liquidities(condition:{provider:"${USER_1_ADDRESS}"}){nodes{id}}`
      );
      expect(user1Data.data.liquidities.nodes.length).toBe(2); // 1 add + 1 remove

      const user2Data = await graphQLPost(
        `liquidities(condition:{provider:"${USER_2_ADDRESS}"}){nodes{id}}`
      );
      expect(user2Data.data.liquidities.nodes.length).toBe(2); // 2 adds
    });

    it('should store correct latest liquidity for user0', async () => {
      // Also check sum of all liquidity records for user0
      const user0AllData = await graphQLPost(
        `liquidities(condition:{provider:"${USER_0_ADDRESS}"}){nodes{stable,lpAmount}}`
      );
      const sumStable = user0AllData.data.liquidities.nodes.reduce(
        (sum: bigint, liq: { stable: string }) => sum + BigInt(liq.stable),
        BigInt(0)
      );
      const sumLpAmount = user0AllData.data.liquidities.nodes.reduce(
        (sum: bigint, liq: { lpAmount: string }) => sum + BigInt(liq.lpAmount),
        BigInt(0)
      );
      expect(sumStable.toString()).toBe('0');
      expect(sumLpAmount.toString()).toBe('0');
    });

    it('should store correct latest liquidity for user1', async () => {
      // Also check sum of all liquidity records for user1
      const user1AllData = await graphQLPost(
        `liquidities(condition:{provider:"${USER_1_ADDRESS}"}){nodes{stable,lpAmount}}`
      );
      const sumStable = user1AllData.data.liquidities.nodes.reduce(
        (sum: bigint, liq: { stable: string }) => sum + BigInt(liq.stable),
        BigInt(0)
      );
      const sumLpAmount = user1AllData.data.liquidities.nodes.reduce(
        (sum: bigint, liq: { lpAmount: string }) => sum + BigInt(liq.lpAmount),
        BigInt(0)
      );
      expect(sumStable.toString()).toBe('0');
      expect(sumLpAmount.toString()).toBe('0');
    });

    it('should store correct latest liquidity for user2', async () => {
      // Also check sum of all liquidity records for user2
      const user2AllData = await graphQLPost(
        `liquidities(condition:{provider:"${USER_2_ADDRESS}"}){nodes{stable,lpAmount}}`
      );
      const sumStable = user2AllData.data.liquidities.nodes.reduce(
        (sum: bigint, liq: { stable: string }) => sum + BigInt(liq.stable),
        BigInt(0)
      );
      const sumLpAmount = user2AllData.data.liquidities.nodes.reduce(
        (sum: bigint, liq: { lpAmount: string }) => sum + BigInt(liq.lpAmount),
        BigInt(0)
      );

      // User2 added 7000 + 2000 = 9000, so latest should be around 9000 (minus fees)
      // Note: Due to fees, the exact amount might be slightly less
      expect(sumStable).toBeGreaterThan(BigInt(expandDecimals(8500))); // At least 8500 after fees
      expect(sumStable).toBeLessThanOrEqual(BigInt(expandDecimals(9000)));
      expect(sumLpAmount).toBeGreaterThan(0);
    });

    it('should store correct total liquidity', async () => {
      const totalData = await graphQLPost(
        `totalLiquidities(condition:{id:"1"}){nodes{stable,lpAmount}}`
      );
      expect(totalData.data.totalLiquidities.nodes.length).toBe(1);

      const totalLiquidity = totalData.data.totalLiquidities.nodes[0];
      // Total should be user2's liquidity (9000 minus fees)
      const stableAmount = BigInt(totalLiquidity.stable);
      expect(stableAmount).toBeGreaterThan(BigInt(expandDecimals(8500)));
      expect(stableAmount).toBeLessThanOrEqual(BigInt(expandDecimals(9000)));
      expect(BigInt(totalLiquidity.lpAmount)).toBeGreaterThan(0);
    });

    it('should have total liquidity match final provider state', async () => {
      // Get user2's sum
      const user2AllData = await graphQLPost(
        `liquidities(condition:{provider:"${USER_2_ADDRESS}"}){nodes{stable,lpAmount}}`
      );
      const user2Stable = user2AllData.data.liquidities.nodes.reduce(
        (sum: bigint, liq: { stable: string }) => sum + BigInt(liq.stable),
        BigInt(0)
      );
      const user2Lp = user2AllData.data.liquidities.nodes.reduce(
        (sum: bigint, liq: { lpAmount: string }) => sum + BigInt(liq.lpAmount),
        BigInt(0)
      );

      // Get total liquidity
      const totalData = await graphQLPost(
        `totalLiquidities(condition:{id:"1"}){nodes{stable,lpAmount}}`
      );
      const totalStable = BigInt(totalData.data.totalLiquidities.nodes[0].stable);
      const totalLp = BigInt(totalData.data.totalLiquidities.nodes[0].lpAmount);

      // Since user0 and user1 removed all liquidity, total should match user2's positive values
      // User2's latest is an add event (positive), so total should match
      expect(totalStable).toBe(user2Stable);
      expect(totalLp).toBe(user2Lp);
    });

    it('should store correct total liquidity timestamp', async () => {
      const totalData = await graphQLPost(
        `totalLiquidities(condition:{id:"1"}){nodes{lastTimestamp}}`
      );
      expect(totalData.data.totalLiquidities.nodes.length).toBe(1);

      const totalTimestamp = totalData.data.totalLiquidities.nodes[0].lastTimestamp;
      const now = Math.floor(Date.now() / 1000);

      // Timestamp should be recent
      expect(totalTimestamp).toBeLessThan(now + 1800);
      expect(totalTimestamp).toBeGreaterThan(now - 1800);

      // Total liquidity timestamp should match the latest provider liquidity timestamp
      const allLiquidityData = await graphQLPost(`liquidities{nodes{timestamp}}`);
      const maxLiquidityTimestamp = Math.max(
        ...allLiquidityData.data.liquidities.nodes.map(
          (liq: { timestamp: number }) => liq.timestamp
        )
      );
      expect(totalTimestamp).toBe(maxLiquidityTimestamp);
    });

    it('should have only one total liquidity record', async () => {
      const totalData = await graphQLPost(`totalLiquidities{nodes{id}}`);
      expect(totalData.data.totalLiquidities.nodes.length).toBe(1);
    });

    it('should have total liquidity with non-negative values', async () => {
      const totalData = await graphQLPost(
        `totalLiquidities(condition:{id:"1"}){nodes{stable,lpAmount}}`
      );
      const totalLiquidity = totalData.data.totalLiquidities.nodes[0];

      expect(BigInt(totalLiquidity.stable)).toBeGreaterThanOrEqual(0);
      expect(BigInt(totalLiquidity.lpAmount)).toBeGreaterThanOrEqual(0);
    });

    it('should store correct liquidity timestamps', async () => {
      const user0Data = await graphQLPost(
        `liquidities(condition:{provider:"${USER_0_ADDRESS}"}){nodes{timestamp}}`
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

    it('should have only one latest record per provider', async () => {
      const user0LatestData = await graphQLPost(
        `liquidities(condition:{provider:"${USER_0_ADDRESS}",latest:true}){nodes{id}}`
      );
      expect(user0LatestData.data.liquidities.nodes.length).toBe(1);

      const user1LatestData = await graphQLPost(
        `liquidities(condition:{provider:"${USER_1_ADDRESS}",latest:true}){nodes{id}}`
      );
      expect(user1LatestData.data.liquidities.nodes.length).toBe(1);

      const user2LatestData = await graphQLPost(
        `liquidities(condition:{provider:"${USER_2_ADDRESS}",latest:true}){nodes{id}}`
      );
      expect(user2LatestData.data.liquidities.nodes.length).toBe(1);
    });

    it('should store correct liquidity progression for user0', async () => {
      const user0Data = await graphQLPost(
        `liquidities(condition:{provider:"${USER_0_ADDRESS}"}){nodes{stable,lpAmount,timestamp}}`
      );
      expect(user0Data.data.liquidities.nodes.length).toBe(4);

      // Sort by timestamp ASC
      const sortedLiquidity = user0Data.data.liquidities.nodes.sort(
        (a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp
      );

      // First add: 10000 USDC (after fees, positive value)
      const firstAdd = sortedLiquidity[0];
      expect(BigInt(firstAdd.stable)).toBeGreaterThanOrEqual(BigInt(expandDecimals(9500))); // After fees
      expect(BigInt(firstAdd.stable)).toBeGreaterThan(0); // Positive
      expect(BigInt(firstAdd.lpAmount)).toBeGreaterThan(0); // Positive

      // Second add: 3000 USDC (after fees, positive value, not accumulated)
      const secondAdd = sortedLiquidity[1];
      expect(BigInt(secondAdd.stable)).toBeGreaterThanOrEqual(BigInt(expandDecimals(2800))); // After fees
      expect(BigInt(secondAdd.stable)).toBeGreaterThan(0); // Positive
      expect(BigInt(secondAdd.lpAmount)).toBeGreaterThan(0); // Positive

      // First remove: negative value (amount removed)
      const firstRemove = sortedLiquidity[2];
      expect(BigInt(firstRemove.stable)).toBeLessThan(0); // Negative
      expect(BigInt(firstRemove.lpAmount)).toBeLessThan(0); // Negative

      // Second remove: negative value (amount removed)
      const secondRemove = sortedLiquidity[3];
      expect(BigInt(secondRemove.stable)).toBeLessThan(0); // Negative
      expect(BigInt(secondRemove.lpAmount)).toBeLessThan(0); // Negative
    });
  });

  afterAll(async () => {
    await client.end();
  });
});
