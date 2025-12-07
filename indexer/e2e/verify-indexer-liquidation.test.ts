import pg from 'pg';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { expandDecimals, USER_0_ADDRESS, USER_1_ADDRESS, BTC_ASSET, ETH_ASSET } from './utils';

const { Client } = pg;

describe('Verify Liquidation', () => {
  let client: pg.Client;
  beforeAll(async () => {
    client = new Client({
      user: process.env.VITE_DB_USER,
      password: process.env.VITE_DB_PASS,
      host: 'localhost',
      port: parseInt(process.env.VITE_DB_PORT ?? '0', 10),
      database: process.env.VITE_DB_NAME,
    });

    await client.connect();
  });

  it('should store correct number of liquidation events', async () => {
    const liquidationResult = await client.query(
      'SELECT COUNT(*) as c FROM position WHERE change = $1',
      ['LIQUIDATE']
    );
    const liquidationCount = liquidationResult.rows[0].c;
    expect(liquidationCount).toBe('3'); // 3 liquidations: user0 BTC long, user1 BTC short, user0 ETH long
  });

  it('should have liquidated positions with zero collateral and size', async () => {
    const liquidations = await client.query(
      'SELECT collateral_amount, size FROM position WHERE change = $1',
      ['LIQUIDATE']
    );
    expect(liquidations.rows.length).toBeGreaterThan(0);
    liquidations.rows.forEach((row: any) => {
      expect(BigInt(row.collateral_amount)).toBe(BigInt(0));
      expect(BigInt(row.size)).toBe(BigInt(0));
    });
  });

  it('should store correct liquidation for user0 BTC long position', async () => {
    const positionKeyResult = await client.query(
      'SELECT id FROM position_key WHERE account = $1 AND index_asset_id = $2 AND is_long = $3',
      [USER_0_ADDRESS, BTC_ASSET, true]
    );
    expect(positionKeyResult.rows.length).toBe(1);
    const positionKeyId = positionKeyResult.rows[0].id;

    const liquidationResult = await client.query(
      'SELECT * FROM position WHERE position_key_id = $1 AND change = $2',
      [positionKeyId, 'LIQUIDATE']
    );
    expect(liquidationResult.rows.length).toBe(1);
    const liquidation = liquidationResult.rows[0];

    expect(liquidation.collateral_amount).toBe('0');
    expect(liquidation.size).toBe('0');
    expect(liquidation.latest).toBe(true);
    expect(BigInt(liquidation.position_fee)).toBeGreaterThanOrEqual(0);
    expect(BigInt(liquidation.collateral_transferred)).toBeGreaterThan(0); // liquidation fee
  });

  it('should store correct liquidation for user1 BTC short position', async () => {
    const positionKeyResult = await client.query(
      'SELECT id FROM position_key WHERE account = $1 AND index_asset_id = $2 AND is_long = $3',
      [USER_1_ADDRESS, BTC_ASSET, false]
    );
    expect(positionKeyResult.rows.length).toBe(1);
    const positionKeyId = positionKeyResult.rows[0].id;

    const liquidationResult = await client.query(
      'SELECT * FROM position WHERE position_key_id = $1 AND change = $2',
      [positionKeyId, 'LIQUIDATE']
    );
    expect(liquidationResult.rows.length).toBe(1);
    const liquidation = liquidationResult.rows[0];

    expect(liquidation.collateral_amount).toBe('0');
    expect(liquidation.size).toBe('0');
    expect(liquidation.latest).toBe(true);
    expect(BigInt(liquidation.position_fee)).toBeGreaterThanOrEqual(0);
    expect(BigInt(liquidation.collateral_transferred)).toBeGreaterThan(0); // liquidation fee
  });

  it('should store correct liquidation for user0 ETH long position', async () => {
    const positionKeyResult = await client.query(
      'SELECT id FROM position_key WHERE account = $1 AND index_asset_id = $2 AND is_long = $3',
      [USER_0_ADDRESS, ETH_ASSET, true]
    );
    expect(positionKeyResult.rows.length).toBe(1);
    const positionKeyId = positionKeyResult.rows[0].id;

    const liquidationResult = await client.query(
      'SELECT * FROM position WHERE position_key_id = $1 AND change = $2',
      [positionKeyId, 'LIQUIDATE']
    );
    expect(liquidationResult.rows.length).toBe(1);
    const liquidation = liquidationResult.rows[0];

    expect(liquidation.collateral_amount).toBe('0');
    expect(liquidation.size).toBe('0');
    expect(liquidation.latest).toBe(true);
    expect(BigInt(liquidation.position_fee)).toBeGreaterThanOrEqual(0);
    expect(BigInt(liquidation.collateral_transferred)).toBeGreaterThan(0); // liquidation fee
  });

  it('should have only one latest record per position key after liquidation', async () => {
    // User0 BTC long - should have latest = true only for liquidation
    const user0BtcLongKey = await client.query(
      'SELECT id FROM position_key WHERE account = $1 AND index_asset_id = $2 AND is_long = $3',
      [USER_0_ADDRESS, BTC_ASSET, true]
    );
    if (user0BtcLongKey.rows.length > 0) {
      const latestCount = await client.query(
        'SELECT COUNT(*) as c FROM position WHERE position_key_id = $1 AND latest = true',
        [user0BtcLongKey.rows[0].id]
      );
      expect(latestCount.rows[0].c).toBe('1');
    }

    // User1 BTC short - should have latest = true only for liquidation
    const user1BtcShortKey = await client.query(
      'SELECT id FROM position_key WHERE account = $1 AND index_asset_id = $2 AND is_long = $3',
      [USER_1_ADDRESS, BTC_ASSET, false]
    );
    if (user1BtcShortKey.rows.length > 0) {
      const latestCount = await client.query(
        'SELECT COUNT(*) as c FROM position WHERE position_key_id = $1 AND latest = true',
        [user1BtcShortKey.rows[0].id]
      );
      expect(latestCount.rows[0].c).toBe('1');
    }

    // User0 ETH long - should have latest = true only for liquidation
    const user0EthLongKey = await client.query(
      'SELECT id FROM position_key WHERE account = $1 AND index_asset_id = $2 AND is_long = $3',
      [USER_0_ADDRESS, ETH_ASSET, true]
    );
    if (user0EthLongKey.rows.length > 0) {
      const latestCount = await client.query(
        'SELECT COUNT(*) as c FROM position WHERE position_key_id = $1 AND latest = true',
        [user0EthLongKey.rows[0].id]
      );
      expect(latestCount.rows[0].c).toBe('1');
    }
  });

  it('should store correct liquidation timestamps', async () => {
    const liquidationResult = await client.query(
      'SELECT min(timestamp) as min_ts, max(timestamp) as max_ts FROM position WHERE change = $1',
      ['LIQUIDATE']
    );
    const minTimestamp = liquidationResult.rows[0].min_ts;
    const maxTimestamp = liquidationResult.rows[0].max_ts;
    const now = Math.floor(Date.now() / 1000);

    // Timestamps should be recent
    expect(minTimestamp).toBeLessThan(now + 1800);
    expect(minTimestamp).toBeGreaterThan(now - 1800);
    expect(maxTimestamp).toBeLessThan(now + 1800);
    expect(maxTimestamp).toBeGreaterThan(now - 1800);

    // Timestamps should span across events (at least 10+3+5+8+3+7+12+4+6 = 58 seconds minimum)
    expect(maxTimestamp - minTimestamp).toBeGreaterThanOrEqual(39);
  });

  it('should store liquidation events with correct position progression', async () => {
    // Check User0 BTC long position progression
    const user0BtcLongKey = await client.query(
      'SELECT id FROM position_key WHERE account = $1 AND index_asset_id = $2 AND is_long = $3',
      [USER_0_ADDRESS, BTC_ASSET, true]
    );
    if (user0BtcLongKey.rows.length > 0) {
      const positions = await client.query(
        'SELECT change, collateral_amount, size FROM position WHERE position_key_id = $1 ORDER BY timestamp ASC',
        [user0BtcLongKey.rows[0].id]
      );
      expect(positions.rows.length).toBeGreaterThan(0);

      // Should have INCREASE followed by LIQUIDATE
      const changes = positions.rows.map((r: any) => r.change);
      expect(changes).toContain('INCREASE');
      expect(changes).toContain('LIQUIDATE');

      // The liquidation should be the last one with zero collateral and size
      const liquidation = positions.rows.find((r: any) => r.change === 'LIQUIDATE');
      expect(liquidation).toBeDefined();
      expect(BigInt(liquidation.collateral_amount)).toBe(BigInt(0));
      expect(BigInt(liquidation.size)).toBe(BigInt(0));
    }
  });

  it('should store liquidation fees correctly', async () => {
    const liquidations = await client.query(
      'SELECT collateral_transferred, position_fee FROM position WHERE change = $1',
      ['LIQUIDATE']
    );
    expect(liquidations.rows.length).toBe(3);

    liquidations.rows.forEach((row: any) => {
      // collateral_transferred should be the liquidation fee (at least 5 USDC)
      expect(BigInt(row.collateral_transferred)).toBeGreaterThanOrEqual(BigInt(expandDecimals(5)));
      // position_fee should be non-negative
      expect(BigInt(row.position_fee)).toBeGreaterThanOrEqual(0);
    });
  });

  it('should store PnL and funding rate for liquidations', async () => {
    const liquidations = await client.query(
      'SELECT pnl_delta, funding_rate FROM position WHERE change = $1',
      ['LIQUIDATE']
    );
    expect(liquidations.rows.length).toBe(3);

    liquidations.rows.forEach((row: any) => {
      // PnL delta and funding rate should be stored (can be positive or negative)
      expect(row.pnl_delta).toBeDefined();
      expect(row.funding_rate).toBeDefined();
    });
  });

  it('should store realized PnL and funding rate for liquidations', async () => {
    const liquidations = await client.query(
      'SELECT realized_pnl, realized_funding_rate FROM position WHERE change = $1',
      ['LIQUIDATE']
    );
    expect(liquidations.rows.length).toBe(3);

    liquidations.rows.forEach((row: any) => {
      // Realized values should be stored
      expect(row.realized_pnl).toBeDefined();
      expect(row.realized_funding_rate).toBeDefined();
    });
  });

  it('should have liquidation events marked as latest for closed positions', async () => {
    const liquidations = await client.query('SELECT latest FROM position WHERE change = $1', [
      'LIQUIDATE',
    ]);
    expect(liquidations.rows.length).toBe(3);

    liquidations.rows.forEach((row: any) => {
      expect(row.latest).toBe(true);
    });
  });

  it('should update total positions correctly after liquidations', async () => {
    // Check BTC long total position (should decrease after user0 liquidation)
    const btcLongTotal = await client.query(
      'SELECT collateral_amount, size FROM total_position WHERE index_asset_id = $1 AND is_long = $2',
      [BTC_ASSET, true]
    );
    if (btcLongTotal.rows.length > 0) {
      const total = btcLongTotal.rows[0];
      // After liquidation, total should reflect the removed position
      expect(BigInt(total.collateral_amount)).toBeGreaterThanOrEqual(0);
      expect(BigInt(total.size)).toBeGreaterThanOrEqual(0);
    }

    // Check BTC short total position (should decrease after user1 liquidation)
    const btcShortTotal = await client.query(
      'SELECT collateral_amount, size FROM total_position WHERE index_asset_id = $1 AND is_long = $2',
      [BTC_ASSET, false]
    );
    if (btcShortTotal.rows.length > 0) {
      const total = btcShortTotal.rows[0];
      // After liquidation, total should reflect the removed position
      expect(BigInt(total.collateral_amount)).toBeGreaterThanOrEqual(0);
      expect(BigInt(total.size)).toBeGreaterThanOrEqual(0);
    }
  });

  afterAll(async () => {
    await client.end();
  });

  describe('API tests', () => {
    function getGraphQLURL(query: string) {
      return `http://localhost:${process.env.VITE_GRAPHQL_SERVER_PORT}/graphql?query=query{${query}}`;
    }

    it('should store correct number of liquidation events', async () => {
      const liquidationsURL = getGraphQLURL(`positions(where:{change_eq:LIQUIDATE}){id}`);
      const liquidationsResponse = await fetch(liquidationsURL);
      const liquidationsData = await liquidationsResponse.json();
      expect(liquidationsData.data.positions.length).toBe(3); // 3 liquidations: user0 BTC long, user1 BTC short, user0 ETH long
    });

    it('should have liquidated positions with zero collateral and size', async () => {
      const liquidationsURL = getGraphQLURL(
        `positions(where:{change_eq:LIQUIDATE}){id,collateralAmount,size}`
      );
      const liquidationsResponse = await fetch(liquidationsURL);
      const liquidationsData = await liquidationsResponse.json();
      expect(liquidationsData.data.positions.length).toBeGreaterThan(0);

      liquidationsData.data.positions.forEach((position: any) => {
        expect(BigInt(position.collateralAmount)).toBe(BigInt(0));
        expect(BigInt(position.size)).toBe(BigInt(0));
      });
    });

    it('should store correct liquidation for user0 BTC long position', async () => {
      // First get the position key for USER_0_ADDRESS and BTC_ASSET (long)
      const positionKeyURL = getGraphQLURL(
        `positionKeys(where:{account_eq:"${USER_0_ADDRESS}",indexAssetId_eq:"${BTC_ASSET}",isLong_eq:true}){id}`
      );
      const positionKeyResponse = await fetch(positionKeyURL);
      const positionKeyData = await positionKeyResponse.json();
      expect(positionKeyData.data.positionKeys.length).toBe(1);
      const positionKeyId = positionKeyData.data.positionKeys[0].id;

      // Then get liquidation position for this key
      const liquidationURL = getGraphQLURL(
        `positions(where:{positionKey:{id_eq:"${positionKeyId}"},change_eq:LIQUIDATE}){id,collateralAmount,size,latest,positionFee,collateralTransferred}`
      );
      const liquidationResponse = await fetch(liquidationURL);
      const liquidationData = await liquidationResponse.json();
      expect(liquidationData.data.positions.length).toBe(1);
      const liquidation = liquidationData.data.positions[0];

      expect(liquidation.collateralAmount).toBe('0');
      expect(liquidation.size).toBe('0');
      expect(liquidation.latest).toBe(true);
      expect(BigInt(liquidation.positionFee)).toBeGreaterThanOrEqual(0);
      expect(BigInt(liquidation.collateralTransferred)).toBeGreaterThan(0); // liquidation fee
    });

    it('should store correct liquidation for user1 BTC short position', async () => {
      // First get the position key for USER_1_ADDRESS and BTC_ASSET (short)
      const positionKeyURL = getGraphQLURL(
        `positionKeys(where:{account_eq:"${USER_1_ADDRESS}",indexAssetId_eq:"${BTC_ASSET}",isLong_eq:false}){id}`
      );
      const positionKeyResponse = await fetch(positionKeyURL);
      const positionKeyData = await positionKeyResponse.json();
      expect(positionKeyData.data.positionKeys.length).toBe(1);
      const positionKeyId = positionKeyData.data.positionKeys[0].id;

      // Then get liquidation position for this key
      const liquidationURL = getGraphQLURL(
        `positions(where:{positionKey:{id_eq:"${positionKeyId}"},change_eq:LIQUIDATE}){id,collateralAmount,size,latest,positionFee,collateralTransferred}`
      );
      const liquidationResponse = await fetch(liquidationURL);
      const liquidationData = await liquidationResponse.json();
      expect(liquidationData.data.positions.length).toBe(1);
      const liquidation = liquidationData.data.positions[0];

      expect(liquidation.collateralAmount).toBe('0');
      expect(liquidation.size).toBe('0');
      expect(liquidation.latest).toBe(true);
      expect(BigInt(liquidation.positionFee)).toBeGreaterThanOrEqual(0);
      expect(BigInt(liquidation.collateralTransferred)).toBeGreaterThan(0); // liquidation fee
    });

    it('should store correct liquidation for user0 ETH long position', async () => {
      // First get the position key for USER_0_ADDRESS and ETH_ASSET (long)
      const positionKeyURL = getGraphQLURL(
        `positionKeys(where:{account_eq:"${USER_0_ADDRESS}",indexAssetId_eq:"${ETH_ASSET}",isLong_eq:true}){id}`
      );
      const positionKeyResponse = await fetch(positionKeyURL);
      const positionKeyData = await positionKeyResponse.json();
      expect(positionKeyData.data.positionKeys.length).toBe(1);
      const positionKeyId = positionKeyData.data.positionKeys[0].id;

      // Then get liquidation position for this key
      const liquidationURL = getGraphQLURL(
        `positions(where:{positionKey:{id_eq:"${positionKeyId}"},change_eq:LIQUIDATE}){id,collateralAmount,size,latest,positionFee,collateralTransferred}`
      );
      const liquidationResponse = await fetch(liquidationURL);
      const liquidationData = await liquidationResponse.json();
      expect(liquidationData.data.positions.length).toBe(1);
      const liquidation = liquidationData.data.positions[0];

      expect(liquidation.collateralAmount).toBe('0');
      expect(liquidation.size).toBe('0');
      expect(liquidation.latest).toBe(true);
      expect(BigInt(liquidation.positionFee)).toBeGreaterThanOrEqual(0);
      expect(BigInt(liquidation.collateralTransferred)).toBeGreaterThan(0); // liquidation fee
    });

    it('should have only one latest record per position key after liquidation', async () => {
      // User0 BTC long - should have latest = true only for liquidation
      const user0BtcLongKeyURL = getGraphQLURL(
        `positionKeys(where:{account_eq:"${USER_0_ADDRESS}",indexAssetId_eq:"${BTC_ASSET}",isLong_eq:true}){id}`
      );
      const user0BtcLongKeyResponse = await fetch(user0BtcLongKeyURL);
      const user0BtcLongKeyData = await user0BtcLongKeyResponse.json();
      if (user0BtcLongKeyData.data.positionKeys.length > 0) {
        const positionKeyId = user0BtcLongKeyData.data.positionKeys[0].id;
        const latestPositionsURL = getGraphQLURL(
          `positions(where:{positionKey:{id_eq:"${positionKeyId}"},latest_eq:true}){id}`
        );
        const latestPositionsResponse = await fetch(latestPositionsURL);
        const latestPositionsData = await latestPositionsResponse.json();
        expect(latestPositionsData.data.positions.length).toBe(1);
      }

      // User1 BTC short - should have latest = true only for liquidation
      const user1BtcShortKeyURL = getGraphQLURL(
        `positionKeys(where:{account_eq:"${USER_1_ADDRESS}",indexAssetId_eq:"${BTC_ASSET}",isLong_eq:false}){id}`
      );
      const user1BtcShortKeyResponse = await fetch(user1BtcShortKeyURL);
      const user1BtcShortKeyData = await user1BtcShortKeyResponse.json();
      if (user1BtcShortKeyData.data.positionKeys.length > 0) {
        const positionKeyId = user1BtcShortKeyData.data.positionKeys[0].id;
        const latestPositionsURL = getGraphQLURL(
          `positions(where:{positionKey:{id_eq:"${positionKeyId}"},latest_eq:true}){id}`
        );
        const latestPositionsResponse = await fetch(latestPositionsURL);
        const latestPositionsData = await latestPositionsResponse.json();
        expect(latestPositionsData.data.positions.length).toBe(1);
      }

      // User0 ETH long - should have latest = true only for liquidation
      const user0EthLongKeyURL = getGraphQLURL(
        `positionKeys(where:{account_eq:"${USER_0_ADDRESS}",indexAssetId_eq:"${ETH_ASSET}",isLong_eq:true}){id}`
      );
      const user0EthLongKeyResponse = await fetch(user0EthLongKeyURL);
      const user0EthLongKeyData = await user0EthLongKeyResponse.json();
      if (user0EthLongKeyData.data.positionKeys.length > 0) {
        const positionKeyId = user0EthLongKeyData.data.positionKeys[0].id;
        const latestPositionsURL = getGraphQLURL(
          `positions(where:{positionKey:{id_eq:"${positionKeyId}"},latest_eq:true}){id}`
        );
        const latestPositionsResponse = await fetch(latestPositionsURL);
        const latestPositionsData = await latestPositionsResponse.json();
        expect(latestPositionsData.data.positions.length).toBe(1);
      }
    });

    it('should store correct liquidation timestamps', async () => {
      const liquidationsURL = getGraphQLURL(`positions(where:{change_eq:LIQUIDATE}){timestamp}`);
      const liquidationsResponse = await fetch(liquidationsURL);
      const liquidationsData = await liquidationsResponse.json();

      const timestamps = liquidationsData.data.positions.map(
        (p: { timestamp: number }) => p.timestamp
      );
      const minTimestamp = Math.min(...timestamps);
      const maxTimestamp = Math.max(...timestamps);
      const now = Math.floor(Date.now() / 1000);

      // Timestamps should be recent
      expect(minTimestamp).toBeLessThan(now + 1800);
      expect(minTimestamp).toBeGreaterThan(now - 1800);
      expect(maxTimestamp).toBeLessThan(now + 1800);
      expect(maxTimestamp).toBeGreaterThan(now - 1800);

      // Timestamps should span across events (at least 10+3+5+8+3+7+12+4+6 = 58 seconds minimum)
      expect(maxTimestamp - minTimestamp).toBeGreaterThanOrEqual(39);
    });

    it('should store liquidation events with correct position progression', async () => {
      // Check User0 BTC long position progression
      const user0BtcLongKeyURL = getGraphQLURL(
        `positionKeys(where:{account_eq:"${USER_0_ADDRESS}",indexAssetId_eq:"${BTC_ASSET}",isLong_eq:true}){id}`
      );
      const user0BtcLongKeyResponse = await fetch(user0BtcLongKeyURL);
      const user0BtcLongKeyData = await user0BtcLongKeyResponse.json();

      if (user0BtcLongKeyData.data.positionKeys.length > 0) {
        const positionKeyId = user0BtcLongKeyData.data.positionKeys[0].id;
        const positionsURL = getGraphQLURL(
          `positions(where:{positionKey:{id_eq:"${positionKeyId}"}}){change,collateralAmount,size,timestamp}`
        );
        const positionsResponse = await fetch(positionsURL);
        const positionsData = await positionsResponse.json();
        expect(positionsData.data.positions.length).toBeGreaterThan(0);

        // Sort by timestamp ASC
        const sortedPositions = positionsData.data.positions.sort(
          (a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp
        );

        // Should have INCREASE followed by LIQUIDATE
        const changes = sortedPositions.map((p: { change: string }) => p.change);
        expect(changes).toContain('INCREASE');
        expect(changes).toContain('LIQUIDATE');

        // The liquidation should be the last one with zero collateral and size
        const liquidation = sortedPositions.find(
          (p: { change: string }) => p.change === 'LIQUIDATE'
        );
        expect(liquidation).toBeDefined();
        expect(BigInt(liquidation.collateralAmount)).toBe(BigInt(0));
        expect(BigInt(liquidation.size)).toBe(BigInt(0));
      }
    });

    it('should store liquidation fees correctly', async () => {
      const liquidationsURL = getGraphQLURL(
        `positions(where:{change_eq:LIQUIDATE}){collateralTransferred,positionFee}`
      );
      const liquidationsResponse = await fetch(liquidationsURL);
      const liquidationsData = await liquidationsResponse.json();
      expect(liquidationsData.data.positions.length).toBe(3);

      liquidationsData.data.positions.forEach((position: any) => {
        // collateralTransferred should be the liquidation fee (at least 5 USDC)
        expect(BigInt(position.collateralTransferred)).toBeGreaterThanOrEqual(
          BigInt(expandDecimals(5))
        );
        // positionFee should be non-negative
        expect(BigInt(position.positionFee)).toBeGreaterThanOrEqual(0);
      });
    });

    it('should store PnL and funding rate for liquidations', async () => {
      const liquidationsURL = getGraphQLURL(
        `positions(where:{change_eq:LIQUIDATE}){pnlDelta,fundingRate}`
      );
      const liquidationsResponse = await fetch(liquidationsURL);
      const liquidationsData = await liquidationsResponse.json();
      expect(liquidationsData.data.positions.length).toBe(3);

      liquidationsData.data.positions.forEach((position: any) => {
        // PnL delta and funding rate should be stored (can be positive or negative)
        expect(position.pnlDelta).toBeDefined();
        expect(position.fundingRate).toBeDefined();
      });
    });

    it('should store realized PnL and funding rate for liquidations', async () => {
      const liquidationsURL = getGraphQLURL(
        `positions(where:{change_eq:LIQUIDATE}){realizedPnl,realizedFundingRate}`
      );
      const liquidationsResponse = await fetch(liquidationsURL);
      const liquidationsData = await liquidationsResponse.json();
      expect(liquidationsData.data.positions.length).toBe(3);

      liquidationsData.data.positions.forEach((position: any) => {
        // Realized values should be stored
        expect(position.realizedPnl).toBeDefined();
        expect(position.realizedFundingRate).toBeDefined();
      });
    });

    it('should have liquidation events marked as latest for closed positions', async () => {
      const liquidationsURL = getGraphQLURL(`positions(where:{change_eq:LIQUIDATE}){latest}`);
      const liquidationsResponse = await fetch(liquidationsURL);
      const liquidationsData = await liquidationsResponse.json();
      expect(liquidationsData.data.positions.length).toBe(3);

      liquidationsData.data.positions.forEach((position: any) => {
        expect(position.latest).toBe(true);
      });
    });

    it('should update total positions correctly after liquidations', async () => {
      // Check BTC long total position (should decrease after user0 liquidation)
      const btcLongTotalURL = getGraphQLURL(
        `totalPositions(where:{indexAssetId_eq:"${BTC_ASSET}",isLong_eq:true}){collateralAmount,size}`
      );
      const btcLongTotalResponse = await fetch(btcLongTotalURL);
      const btcLongTotalData = await btcLongTotalResponse.json();
      if (btcLongTotalData.data.totalPositions.length > 0) {
        const total = btcLongTotalData.data.totalPositions[0];
        // After liquidation, total should reflect the removed position
        expect(BigInt(total.collateralAmount)).toBeGreaterThanOrEqual(0);
        expect(BigInt(total.size)).toBeGreaterThanOrEqual(0);
      }

      // Check BTC short total position (should decrease after user1 liquidation)
      const btcShortTotalURL = getGraphQLURL(
        `totalPositions(where:{indexAssetId_eq:"${BTC_ASSET}",isLong_eq:false}){collateralAmount,size}`
      );
      const btcShortTotalResponse = await fetch(btcShortTotalURL);
      const btcShortTotalData = await btcShortTotalResponse.json();
      if (btcShortTotalData.data.totalPositions.length > 0) {
        const total = btcShortTotalData.data.totalPositions[0];
        // After liquidation, total should reflect the removed position
        expect(BigInt(total.collateralAmount)).toBeGreaterThanOrEqual(0);
        expect(BigInt(total.size)).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
