import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BNB_ASSET, BTC_ASSET, ETH_ASSET, USER_0_ADDRESS, expandDecimals } from './utils';

const { Client } = pg;

describe('Verify Positions', () => {
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

  it('should find correct total positions', async () => {
    const totalPositionBTCLongResult = await client.query(
      'SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2',
      [BTC_ASSET, true]
    );
    const totalPositionBTCShortResult = await client.query(
      'SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2',
      [BTC_ASSET, false]
    );
    const totalPositionETHLongResult = await client.query(
      'SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2',
      [ETH_ASSET, true]
    );
    const totalPositionETHShortResult = await client.query(
      'SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2',
      [ETH_ASSET, false]
    );
    const totalPositionBNBLongResult = await client.query(
      'SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2',
      [BNB_ASSET, true]
    );
    const totalPositionBNBShortResult = await client.query(
      'SELECT * FROM total_position WHERE index_asset_id = $1 AND is_long = $2',
      [BNB_ASSET, false]
    );

    expect(totalPositionBTCLongResult.rows.length).toBe(1);
    expect(totalPositionBTCShortResult.rows.length).toBe(1);
    expect(totalPositionETHLongResult.rows.length).toBe(1);
    expect(totalPositionETHShortResult.rows.length).toBe(0);
    expect(totalPositionBNBLongResult.rows.length).toBe(1);
    expect(totalPositionBNBShortResult.rows.length).toBe(0);

    expect(totalPositionBTCLongResult.rows[0].size).toBe(expandDecimals(1000));
    expect(totalPositionBTCShortResult.rows[0].size).toBe(expandDecimals(1000));
    expect(totalPositionETHLongResult.rows[0].size).toBe(expandDecimals(3000));
    expect(totalPositionBNBLongResult.rows[0].size).toBe('0');
  });

  it('should position key be unique', async () => {
    const positionKeyResult = await client.query(
      'SELECT COUNT(1) as c FROM position_key GROUP BY account, index_asset_id, is_long HAVING COUNT(1) > 1'
    );
    // Postgres returns no rows instead of 0 value
    expect(positionKeyResult.rows.length).toBe(0);
  });

  it('should be the the correct count of BNB closed positions', async () => {
    const positionKeyResult = await client.query(
      'SELECT id FROM position_key WHERE account = $1 AND index_asset_id = $2 AND is_long = $3',
      [USER_0_ADDRESS, BNB_ASSET, true]
    );
    const positionKeyId = positionKeyResult.rows[0].id;
    const closedPositionBNBResult = await client.query(
      'SELECT * FROM position WHERE position_key_id = $1 AND change = $2',
      [positionKeyId, 'CLOSE']
    );
    expect(closedPositionBNBResult.rows.length).toBe(2);
  });

  it('should BNB positions have the same position key', async () => {
    const positionBNBResult = await client.query(
      'SELECT COUNT(DISTINCT position_key_id) as c FROM position WHERE position_key_id in (SELECT id FROM position_key WHERE position_key.index_asset_id = $1)',
      [BNB_ASSET]
    );
    expect(positionBNBResult.rows[0].c).toBe('1');
  });

  it('should be exactly 1 latest position for each position key', async () => {
    // position keys with more than 1 latest position
    const positionKeyResult = await client.query(
      'SELECT position_key.id AS c FROM position_key LEFT JOIN position ON position_key.id = position.position_key_id AND position.latest = TRUE GROUP BY position_key.id HAVING COUNT(1) <> 1'
    );
    expect(positionKeyResult.rows.length).toBe(0);
  });

  it('should be two BTC positions', async () => {
    // one position is long, one is short
    const positionKeyResult = await client.query(
      'SELECT account, is_long FROM position_key WHERE index_asset_id = $1',
      [BTC_ASSET]
    );
    expect(positionKeyResult.rows.length).toBe(2);
    expect(positionKeyResult.rows[0].account).not.toBe(positionKeyResult.rows[1].account);
    expect(positionKeyResult.rows[0].is_long).not.toBe(positionKeyResult.rows[1].is_long);
  });

  it('should closed positions have no size', async () => {
    const closedPositionResult = await client.query(
      'SELECT id FROM position WHERE change = $1 AND size <> 0',
      ['CLOSE']
    );
    expect(closedPositionResult.rows.length).toBe(0);
  });

  it('should positions with no size be closed', async () => {
    const closedPositionResult = await client.query(
      'SELECT id FROM position WHERE change <> $1 AND size = 0',
      ['CLOSE']
    );
    expect(closedPositionResult.rows.length).toBe(0);
  });

  it('should positions with no size have no collateral', async () => {
    const closedPositionResult = await client.query(
      'SELECT id FROM position WHERE size = 0 AND collateral_amount <> 0'
    );
    expect(closedPositionResult.rows.length).toBe(0);
  });

  it('should positions with no collateral have no size', async () => {
    const closedPositionResult = await client.query(
      'SELECT id FROM position WHERE collateral_amount = 0 AND size <> 0'
    );
    expect(closedPositionResult.rows.length).toBe(0);
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

    it('should find correct total positions', async () => {
      const btcLongData = await graphQLPost(
        `totalPositions(condition:{indexAssetId:"${BTC_ASSET}",isLong:true}){nodes{id,size}}`
      );
      expect(btcLongData.data.totalPositions.nodes.length).toBe(1);
      expect(btcLongData.data.totalPositions.nodes[0].size).toBe(expandDecimals(1000));

      const btcShortData = await graphQLPost(
        `totalPositions(condition:{indexAssetId:"${BTC_ASSET}",isLong:false}){nodes{id,size}}`
      );
      expect(btcShortData.data.totalPositions.nodes.length).toBe(1);
      expect(btcShortData.data.totalPositions.nodes[0].size).toBe(expandDecimals(1000));

      const ethLongData = await graphQLPost(
        `totalPositions(condition:{indexAssetId:"${ETH_ASSET}",isLong:true}){nodes{id,size}}`
      );
      expect(ethLongData.data.totalPositions.nodes.length).toBe(1);
      expect(ethLongData.data.totalPositions.nodes[0].size).toBe(expandDecimals(3000));

      const ethShortData = await graphQLPost(
        `totalPositions(condition:{indexAssetId:"${ETH_ASSET}",isLong:false}){nodes{id}}`
      );
      expect(ethShortData.data.totalPositions.nodes.length).toBe(0);

      const bnbLongData = await graphQLPost(
        `totalPositions(condition:{indexAssetId:"${BNB_ASSET}",isLong:true}){nodes{id,size}}`
      );
      expect(bnbLongData.data.totalPositions.nodes.length).toBe(1);
      expect(bnbLongData.data.totalPositions.nodes[0].size).toBe('0');

      const bnbShortData = await graphQLPost(
        `totalPositions(condition:{indexAssetId:"${BNB_ASSET}",isLong:false}){nodes{id}}`
      );
      expect(bnbShortData.data.totalPositions.nodes.length).toBe(0);
    });

    it('should position key be unique', async () => {
      const positionKeysData = await graphQLPost(
        `positionKeys{nodes{id,account,indexAssetId,isLong}}`
      );

      // Check that there are no duplicate combinations of account, indexAssetId, and isLong
      const seen = new Set<string>();
      positionKeysData.data.positionKeys.nodes.forEach(
        (key: { account: string; indexAssetId: string; isLong: boolean }) => {
          const uniqueKey = `${key.account}-${key.indexAssetId}-${key.isLong}`;
          expect(seen.has(uniqueKey)).toBe(false);
          seen.add(uniqueKey);
        }
      );
    });

    it('should be the the correct count of BNB closed positions', async () => {
      // First get the position key for USER_0_ADDRESS and BNB_ASSET
      const positionKeyData = await graphQLPost(
        `positionKeys(condition:{account:"${USER_0_ADDRESS}",indexAssetId:"${BNB_ASSET}",isLong:true}){nodes{id}}`
      );
      expect(positionKeyData.data.positionKeys.nodes.length).toBe(1);
      const positionKeyId = positionKeyData.data.positionKeys.nodes[0].id;

      // Then get closed positions for this key
      const closedPositionsData = await graphQLPost(
        `positions(condition:{positionKeyId:"${positionKeyId}",change:"CLOSE"}){nodes{id}}`
      );
      expect(closedPositionsData.data.positions.nodes.length).toBe(2);
    });

    it('should BNB positions have the same position key', async () => {
      // Get all positions for these keys
      const allPositionsData = await graphQLPost(
        `positions{nodes{id,positionKey{id,indexAssetId}}}`
      );

      // Filter positions for BNB
      const bnbPositions = allPositionsData.data.positions.nodes.filter(
        (p: { positionKey: { indexAssetId: string } }) => p.positionKey.indexAssetId === BNB_ASSET
      );

      // Get unique position key IDs
      const uniquePositionKeyIds = new Set(
        bnbPositions.map((p: { positionKey: { id: string } }) => p.positionKey.id)
      );

      expect(uniquePositionKeyIds.size).toBe(1);
    });

    it('should be exactly 1 latest position for each position key', async () => {
      // Get all position keys
      const positionKeysData = await graphQLPost(`positionKeys{nodes{id}}`);

      // For each position key, check that there's exactly one latest position

      for (const key of positionKeysData.data.positionKeys.nodes) {
        const latestPositionsData = await graphQLPost(
          `positions(condition:{positionKeyId:"${key.id}",latest:true}){nodes{id}}`
        );
        expect(latestPositionsData.data.positions.nodes.length).toBe(1);
      }
    });

    it('should be two BTC positions', async () => {
      const positionKeysData = await graphQLPost(
        `positionKeys(condition:{indexAssetId:"${BTC_ASSET}"}){nodes{id,account,isLong}}`
      );

      expect(positionKeysData.data.positionKeys.nodes.length).toBe(2);
      expect(positionKeysData.data.positionKeys.nodes[0].account).not.toBe(
        positionKeysData.data.positionKeys.nodes[1].account
      );
      expect(positionKeysData.data.positionKeys.nodes[0].isLong).not.toBe(
        positionKeysData.data.positionKeys.nodes[1].isLong
      );
    });

    it('should closed positions have no size', async () => {
      const closedPositionsData = await graphQLPost(
        `positions(condition:{change:"CLOSE"}){nodes{id,size}}`
      );

      // All closed positions should have size 0
      closedPositionsData.data.positions.nodes.forEach((position: { size: string }) => {
        expect(position.size).toBe('0');
      });
    });

    it('should positions with no size be closed', async () => {
      // Note: GraphQL doesn't directly support filtering by size = 0,
      // so we'll fetch all positions and filter client-side
      const allPositionsData = await graphQLPost(`positions{nodes{id,size,change}}`);

      // Filter positions with size 0
      const positionsWithNoSize = allPositionsData.data.positions.nodes.filter(
        (p: { size: string }) => p.size === '0'
      );

      // All should have change = CLOSE
      positionsWithNoSize.forEach((position: { change: string }) => {
        expect(position.change).toBe('CLOSE');
      });
    });

    it('should positions with no size have no collateral', async () => {
      const allPositionsData = await graphQLPost(`positions{nodes{id,size,collateralAmount}}`);

      // Filter positions with size 0
      const positionsWithNoSize = allPositionsData.data.positions.nodes.filter(
        (p: { size: string }) => p.size === '0'
      );

      // All should have collateralAmount 0
      positionsWithNoSize.forEach((position: { collateralAmount: string }) => {
        expect(position.collateralAmount).toBe('0');
      });
    });

    it('should positions with no collateral have no size', async () => {
      const allPositionsData = await graphQLPost(`positions{nodes{id,size,collateralAmount}}`);

      // Filter positions with collateralAmount 0
      const positionsWithNoCollateral = allPositionsData.data.positions.nodes.filter(
        (p: { collateralAmount: string }) => p.collateralAmount === '0'
      );

      // All should have size 0
      positionsWithNoCollateral.forEach((position: { size: string }) => {
        expect(position.size).toBe('0');
      });
    });
  });

  afterAll(async () => {
    await client.end();
  });
});
