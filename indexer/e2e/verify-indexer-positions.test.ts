import pg from 'pg';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { BNB_ASSET, expandDecimals, BTC_ASSET, ETH_ASSET, USER_0_ADDRESS } from './utils';

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
    function getGraphQLURL(query: string) {
      return `http://localhost:${process.env.VITE_GRAPHQL_SERVER_PORT}/graphql?query=query{${query}}`;
    }

    it('should find correct total positions', async () => {
      const btcLongURL = getGraphQLURL(
        `totalPositions(where:{indexAssetId_eq:"${BTC_ASSET}",isLong_eq:true}){id,size}`
      );
      const btcLongResponse = await fetch(btcLongURL);
      if (!btcLongResponse.ok) {
        throw new Error(`GraphQL request failed: ${btcLongResponse.status}`);
      }
      const btcLongData = await btcLongResponse.json();
      expect(btcLongData.data.totalPositions.length).toBe(1);
      expect(btcLongData.data.totalPositions[0].size).toBe(expandDecimals(1000));

      const btcShortURL = getGraphQLURL(
        `totalPositions(where:{indexAssetId_eq:"${BTC_ASSET}",isLong_eq:false}){id,size}`
      );
      const btcShortResponse = await fetch(btcShortURL);
      if (!btcShortResponse.ok) {
        throw new Error(`GraphQL request failed: ${btcShortResponse.status}`);
      }
      const btcShortData = await btcShortResponse.json();
      expect(btcShortData.data.totalPositions.length).toBe(1);
      expect(btcShortData.data.totalPositions[0].size).toBe(expandDecimals(1000));

      const ethLongURL = getGraphQLURL(
        `totalPositions(where:{indexAssetId_eq:"${ETH_ASSET}",isLong_eq:true}){id,size}`
      );
      const ethLongResponse = await fetch(ethLongURL);
      if (!ethLongResponse.ok) {
        throw new Error(`GraphQL request failed: ${ethLongResponse.status}`);
      }
      const ethLongData = await ethLongResponse.json();
      expect(ethLongData.data.totalPositions.length).toBe(1);
      expect(ethLongData.data.totalPositions[0].size).toBe(expandDecimals(3000));

      const ethShortURL = getGraphQLURL(
        `totalPositions(where:{indexAssetId_eq:"${ETH_ASSET}",isLong_eq:false}){id}`
      );
      const ethShortResponse = await fetch(ethShortURL);
      if (!ethShortResponse.ok) {
        throw new Error(`GraphQL request failed: ${ethShortResponse.status}`);
      }
      const ethShortData = await ethShortResponse.json();
      expect(ethShortData.data.totalPositions.length).toBe(0);

      const bnbLongURL = getGraphQLURL(
        `totalPositions(where:{indexAssetId_eq:"${BNB_ASSET}",isLong_eq:true}){id,size}`
      );
      const bnbLongResponse = await fetch(bnbLongURL);
      if (!bnbLongResponse.ok) {
        throw new Error(`GraphQL request failed: ${bnbLongResponse.status}`);
      }
      const bnbLongData = await bnbLongResponse.json();
      expect(bnbLongData.data.totalPositions.length).toBe(1);
      expect(bnbLongData.data.totalPositions[0].size).toBe('0');

      const bnbShortURL = getGraphQLURL(
        `totalPositions(where:{indexAssetId_eq:"${BNB_ASSET}",isLong_eq:false}){id}`
      );
      const bnbShortResponse = await fetch(bnbShortURL);
      if (!bnbShortResponse.ok) {
        throw new Error(`GraphQL request failed: ${bnbShortResponse.status}`);
      }
      const bnbShortData = await bnbShortResponse.json();
      expect(bnbShortData.data.totalPositions.length).toBe(0);
    });

    it('should position key be unique', async () => {
      const positionKeysURL = getGraphQLURL(`positionKeys{id,account,indexAssetId,isLong}`);
      const positionKeysResponse = await fetch(positionKeysURL);
      if (!positionKeysResponse.ok) {
        throw new Error(`GraphQL request failed: ${positionKeysResponse.status}`);
      }
      const positionKeysData = await positionKeysResponse.json();

      // Check that there are no duplicate combinations of account, indexAssetId, and isLong
      const seen = new Set<string>();
      positionKeysData.data.positionKeys.forEach(
        (key: { account: string; indexAssetId: string; isLong: boolean }) => {
          const uniqueKey = `${key.account}-${key.indexAssetId}-${key.isLong}`;
          expect(seen.has(uniqueKey)).toBe(false);
          seen.add(uniqueKey);
        }
      );
    });

    it('should be the the correct count of BNB closed positions', async () => {
      // First get the position key for USER_0_ADDRESS and BNB_ASSET
      const positionKeyURL = getGraphQLURL(
        `positionKeys(where:{account_eq:"${USER_0_ADDRESS}",indexAssetId_eq:"${BNB_ASSET}",isLong_eq:true}){id}`
      );
      const positionKeyResponse = await fetch(positionKeyURL);
      if (!positionKeyResponse.ok) {
        throw new Error(`GraphQL request failed: ${positionKeyResponse.status}`);
      }
      const positionKeyData = await positionKeyResponse.json();
      expect(positionKeyData.data.positionKeys.length).toBe(1);
      const positionKeyId = positionKeyData.data.positionKeys[0].id;

      // Then get closed positions for this key
      const closedPositionsURL = getGraphQLURL(
        `positions(where:{positionKey:{id_eq:"${positionKeyId}"},change_eq:CLOSE}){id}`
      );
      const closedPositionsResponse = await fetch(closedPositionsURL);
      if (!closedPositionsResponse.ok) {
        throw new Error(`GraphQL request failed: ${closedPositionsResponse.status}`);
      }
      const closedPositionsData = await closedPositionsResponse.json();
      expect(closedPositionsData.data.positions.length).toBe(2);
    });

    it('should BNB positions have the same position key', async () => {
      // Get all positions for these keys
      const allPositionsURL = getGraphQLURL(`positions{id,positionKey{id,indexAssetId}}`);
      const allPositionsResponse = await fetch(allPositionsURL);
      if (!allPositionsResponse.ok) {
        throw new Error(`GraphQL request failed: ${allPositionsResponse.status}`);
      }
      const allPositionsData = await allPositionsResponse.json();

      // Filter positions for BNB
      const bnbPositions = allPositionsData.data.positions.filter(
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
      const positionKeysURL = getGraphQLURL(`positionKeys{id}`);
      const positionKeysResponse = await fetch(positionKeysURL);
      const positionKeysData = await positionKeysResponse.json();

      // For each position key, check that there's exactly one latest position
      // eslint-disable-next-line no-restricted-syntax
      for (const key of positionKeysData.data.positionKeys) {
        const latestPositionsURL = getGraphQLURL(
          `positions(where:{positionKey:{id_eq:"${key.id}"},latest_eq:true}){id}`
        );
        // eslint-disable-next-line no-await-in-loop
        const latestPositionsResponse = await fetch(latestPositionsURL);
        // eslint-disable-next-line no-await-in-loop
        const latestPositionsData = await latestPositionsResponse.json();
        expect(latestPositionsData.data.positions.length).toBe(1);
      }
    });

    it('should be two BTC positions', async () => {
      const positionKeysURL = getGraphQLURL(
        `positionKeys(where:{indexAssetId_eq:"${BTC_ASSET}"}){id,account,isLong}`
      );
      const positionKeysResponse = await fetch(positionKeysURL);
      if (!positionKeysResponse.ok) {
        throw new Error(`GraphQL request failed: ${positionKeysResponse.status}`);
      }
      const positionKeysData = await positionKeysResponse.json();

      expect(positionKeysData.data.positionKeys.length).toBe(2);
      expect(positionKeysData.data.positionKeys[0].account).not.toBe(
        positionKeysData.data.positionKeys[1].account
      );
      expect(positionKeysData.data.positionKeys[0].isLong).not.toBe(
        positionKeysData.data.positionKeys[1].isLong
      );
    });

    it('should closed positions have no size', async () => {
      const closedPositionsURL = getGraphQLURL(`positions(where:{change_eq:CLOSE}){id,size}`);
      const closedPositionsResponse = await fetch(closedPositionsURL);
      if (!closedPositionsResponse.ok) {
        throw new Error(`GraphQL request failed: ${closedPositionsResponse.status}`);
      }
      const closedPositionsData = await closedPositionsResponse.json();

      // All closed positions should have size 0
      closedPositionsData.data.positions.forEach((position: { size: string }) => {
        expect(position.size).toBe('0');
      });
    });

    it('should positions with no size be closed', async () => {
      // Note: GraphQL doesn't directly support filtering by size = 0,
      // so we'll fetch all positions and filter client-side
      const allPositionsURL = getGraphQLURL(`positions{id,size,change}`);
      const allPositionsResponse = await fetch(allPositionsURL);
      if (!allPositionsResponse.ok) {
        throw new Error(`GraphQL request failed: ${allPositionsResponse.status}`);
      }
      const allPositionsData = await allPositionsResponse.json();

      // Filter positions with size 0
      const positionsWithNoSize = allPositionsData.data.positions.filter(
        (p: { size: string }) => p.size === '0'
      );

      // All should have change = CLOSE
      positionsWithNoSize.forEach((position: { change: string }) => {
        expect(position.change).toBe('CLOSE');
      });
    });

    it('should positions with no size have no collateral', async () => {
      const allPositionsURL = getGraphQLURL(`positions{id,size,collateralAmount}`);
      const allPositionsResponse = await fetch(allPositionsURL);
      if (!allPositionsResponse.ok) {
        throw new Error(`GraphQL request failed: ${allPositionsResponse.status}`);
      }
      const allPositionsData = await allPositionsResponse.json();

      // Filter positions with size 0
      const positionsWithNoSize = allPositionsData.data.positions.filter(
        (p: { size: string }) => p.size === '0'
      );

      // All should have collateralAmount 0
      positionsWithNoSize.forEach((position: { collateralAmount: string }) => {
        expect(position.collateralAmount).toBe('0');
      });
    });

    it('should positions with no collateral have no size', async () => {
      const allPositionsURL = getGraphQLURL(`positions{id,size,collateralAmount}`);
      const allPositionsResponse = await fetch(allPositionsURL);
      if (!allPositionsResponse.ok) {
        throw new Error(`GraphQL request failed: ${allPositionsResponse.status}`);
      }
      const allPositionsData = await allPositionsResponse.json();

      // Filter positions with collateralAmount 0
      const positionsWithNoCollateral = allPositionsData.data.positions.filter(
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
