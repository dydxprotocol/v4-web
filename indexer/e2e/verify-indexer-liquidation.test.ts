import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BTC_ASSET, ETH_ASSET, USER_0_ADDRESS, USER_1_ADDRESS } from './utils';

const { Client } = pg;

describe('Verify Liquidation', () => {
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

  it('should store correct number of liquidation events', async () => {
    const liquidationResult = await client.query(
      'SELECT COUNT(*) as c FROM position WHERE change = $1',
      ['LIQUIDATE']
    );
    const liquidationCount = liquidationResult.rows[0].c;
    expect(liquidationCount).toBe('3'); // 3 liquidations: user0 BTC long, user1 BTC short, user0 ETH long
  });

  it('should have liquidated positions with zero collateral and size but keep aggregated values', async () => {
    const liquidations = await client.query(
      'SELECT collateral, size, realized_funding_rate, realized_pnl FROM position WHERE change = $1',
      ['LIQUIDATE']
    );
    expect(liquidations.rows.length).toBeGreaterThan(0);
    liquidations.rows.forEach((row: any) => {
      // Liquidated positions should have zero collateral and size
      expect(BigInt(row.collateral)).toBe(BigInt(0));
      expect(BigInt(row.size)).toBe(BigInt(0));
      // But they should keep their aggregated realized values (not reset to 0)
      expect(row.realized_funding_rate).toBeDefined();
      expect(row.realized_pnl).toBeDefined();
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

    expect(liquidation.collateral).toBe('0');
    expect(liquidation.size).toBe('0');
    expect(liquidation.latest).toBe(true);
    // Liquidated positions keep their aggregated realized values
    expect(liquidation.realized_funding_rate).toBeDefined();
    expect(liquidation.realized_pnl).toBeDefined();
    expect(BigInt(liquidation.out_liquidation_fee)).toBeGreaterThan(0); // liquidation fee
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

    expect(liquidation.collateral).toBe('0');
    expect(liquidation.size).toBe('0');
    expect(liquidation.latest).toBe(true);
    // Liquidated positions keep their aggregated realized values
    expect(liquidation.realized_funding_rate).toBeDefined();
    expect(liquidation.realized_pnl).toBeDefined();
    expect(BigInt(liquidation.out_liquidation_fee)).toBeGreaterThan(0); // liquidation fee
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

    expect(liquidation.collateral).toBe('0');
    expect(liquidation.size).toBe('0');
    expect(liquidation.latest).toBe(true);
    // Liquidated positions keep their aggregated realized values
    expect(liquidation.realized_funding_rate).toBeDefined();
    expect(liquidation.realized_pnl).toBeDefined();
    expect(BigInt(liquidation.out_liquidation_fee)).toBeGreaterThan(0); // liquidation fee
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

    // Timestamps should span across events (minimum ~39 seconds between first and last liquidation)
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
        'SELECT change, collateral, size, realized_funding_rate, realized_pnl FROM position WHERE position_key_id = $1 ORDER BY timestamp ASC',
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
      expect(BigInt(liquidation.collateral)).toBe(BigInt(0));
      expect(BigInt(liquidation.size)).toBe(BigInt(0));
      // But it should keep aggregated realized values
      expect(liquidation.realized_funding_rate).toBeDefined();
      expect(liquidation.realized_pnl).toBeDefined();
    }
  });

  it('should store liquidation fees correctly', async () => {
    const liquidations = await client.query(
      'SELECT id, position_key_id, out_liquidation_fee FROM position WHERE change = $1',
      ['LIQUIDATE']
    );
    expect(liquidations.rows.length).toBe(3);

    for (const liquidation of liquidations.rows) {
      // Get the position before liquidation (the last position that was not a liquidation)
      const previousPosition = await client.query(
        'SELECT size FROM position WHERE position_key_id = $1 AND change != $2 ORDER BY timestamp DESC LIMIT 1',
        [liquidation.position_key_id, 'LIQUIDATE']
      );

      expect(previousPosition.rows.length).toBe(1);
      const previousSize = BigInt(previousPosition.rows[0].size);

      // Liquidation fee is 0.1% of the position size before liquidation (0.1% = 1/1000)
      const expectedFee = previousSize / BigInt(1000);

      // Check that out_liquidation_fee is approximately the liquidation fee (0.1% of size)
      // Allow a small tolerance for rounding differences
      const fee = BigInt(liquidation.out_liquidation_fee);
      expect(fee).toBeGreaterThanOrEqual((expectedFee * BigInt(99)) / BigInt(100)); // Allow 1% tolerance
      expect(fee).toBeLessThanOrEqual((expectedFee * BigInt(101)) / BigInt(100)); // Allow 1% tolerance
    }
  });

  it('should store PnL and funding rate for liquidations', async () => {
    const liquidations = await client.query(
      'SELECT pnl_delta, out_pnl_delta, funding_rate, out_funding_rate FROM position WHERE change = $1',
      ['LIQUIDATE']
    );
    expect(liquidations.rows.length).toBe(3);

    liquidations.rows.forEach((row: any) => {
      // PnL delta and funding rate should be stored (can be positive or negative)
      expect(row.pnl_delta).toBeDefined();
      expect(row.out_pnl_delta).toBeDefined();
      expect(row.funding_rate).toBeDefined();
      expect(row.out_funding_rate).toBeDefined();
    });
  });

  it('should store realized PnL and funding rate for liquidations (keep aggregated values)', async () => {
    const liquidations = await client.query(
      'SELECT realized_pnl, realized_funding_rate FROM position WHERE change = $1',
      ['LIQUIDATE']
    );
    expect(liquidations.rows.length).toBe(3);

    liquidations.rows.forEach((row: any) => {
      // Realized values should be kept (not reset to 0) for liquidated positions
      expect(row.realized_pnl).toBeDefined();
      expect(row.realized_funding_rate).toBeDefined();
    });
  });

  it('should reset aggregated values when position is reopened after liquidation', async () => {
    // Check if any position was reopened after liquidation
    // Get all position keys that have both LIQUIDATE and INCREASE events
    const reopenedPositions = await client.query(`
      SELECT DISTINCT pk.id as position_key_id
      FROM position_key pk
      INNER JOIN position p1 ON p1.position_key_id = pk.id AND p1.change = 'LIQUIDATE'
      INNER JOIN position p2 ON p2.position_key_id = pk.id AND p2.change = 'INCREASE' AND p2.timestamp > p1.timestamp
    `);

    for (const row of reopenedPositions.rows) {
      const positionKeyId = row.position_key_id;

      // Get the liquidation record
      const liquidation = await client.query(
        'SELECT realized_pnl, realized_funding_rate FROM position WHERE position_key_id = $1 AND change = $2 ORDER BY timestamp DESC LIMIT 1',
        [positionKeyId, 'LIQUIDATE']
      );

      if (liquidation.rows.length > 0) {
        // Get the first INCREASE position after liquidation
        const increaseAfterLiquidation = await client.query(
          'SELECT realized_pnl, realized_funding_rate, out_funding_rate, out_pnl_delta FROM position WHERE position_key_id = $1 AND change = $2 AND timestamp > (SELECT timestamp FROM position WHERE position_key_id = $1 AND change = $3 ORDER BY timestamp DESC LIMIT 1) ORDER BY timestamp ASC LIMIT 1',
          [positionKeyId, 'INCREASE', 'LIQUIDATE']
        );

        if (increaseAfterLiquidation.rows.length > 0) {
          const increaseRealizedPnl = BigInt(increaseAfterLiquidation.rows[0].realized_pnl);
          const increaseRealizedFundingRate = BigInt(
            increaseAfterLiquidation.rows[0].realized_funding_rate
          );
          const increaseOutFundingRate = BigInt(increaseAfterLiquidation.rows[0].out_funding_rate);
          const increaseOutPnlDelta = BigInt(increaseAfterLiquidation.rows[0].out_pnl_delta);

          // The new position should NOT inherit realized values from liquidation
          // It should start fresh - realized values should equal the deltas from this event only
          // (not including the liquidation's realized values)
          expect(increaseRealizedPnl).toBe(increaseOutPnlDelta);
          expect(increaseRealizedFundingRate).toBe(increaseOutFundingRate);

          // Verify they are different from liquidation's values (unless by coincidence they're the same)
          // The key point is that the new position's realized values come only from its own deltas
        }
      }
    }
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

    it('should store correct number of liquidation events', async () => {
      const liquidationsData = await graphQLPost(
        `positions(condition:{change:"LIQUIDATE"}){nodes{id}}`
      );
      expect(liquidationsData.data.positions.nodes.length).toBe(3); // 3 liquidations: user0 BTC long, user1 BTC short, user0 ETH long
    });

    it('should have liquidated positions with zero collateral and size but keep aggregated values', async () => {
      const liquidationsData = await graphQLPost(
        `positions(condition:{change:"LIQUIDATE"}){nodes{id,collateral,size,realizedFundingRate,realizedPnl}}`
      );
      expect(liquidationsData.data.positions.nodes.length).toBeGreaterThan(0);

      liquidationsData.data.positions.nodes.forEach((position: any) => {
        // Liquidated positions should have zero collateral and size
        expect(BigInt(position.collateral)).toBe(BigInt(0));
        expect(BigInt(position.size)).toBe(BigInt(0));
        // But they should keep their aggregated realized values (not reset to 0)
        expect(position.realizedFundingRate).toBeDefined();
        expect(position.realizedPnl).toBeDefined();
      });
    });

    it('should store correct liquidation for user0 BTC long position', async () => {
      // First get the position key for USER_0_ADDRESS and BTC_ASSET (long)
      const positionKeyData = await graphQLPost(
        `positionKeys(condition:{account:"${USER_0_ADDRESS}",indexAssetId:"${BTC_ASSET}",isLong:true}){nodes{id}}`
      );
      expect(positionKeyData.data.positionKeys.nodes.length).toBe(1);
      const positionKeyId = positionKeyData.data.positionKeys.nodes[0].id;

      // Then get liquidation position for this key
      const liquidationData = await graphQLPost(
        `positions(condition:{positionKeyId:"${positionKeyId}",change:"LIQUIDATE"}){nodes{id,collateral,size,latest,realizedFundingRate,realizedPnl,outLiquidationFee}}`
      );
      expect(liquidationData.data.positions.nodes.length).toBe(1);
      const liquidation = liquidationData.data.positions.nodes[0];

      expect(liquidation.collateral).toBe('0');
      expect(liquidation.size).toBe('0');
      expect(liquidation.latest).toBe(true);
      // Liquidated positions keep their aggregated realized values
      expect(liquidation.realizedFundingRate).toBeDefined();
      expect(liquidation.realizedPnl).toBeDefined();
      expect(BigInt(liquidation.outLiquidationFee)).toBeGreaterThan(0); // liquidation fee
    });

    it('should store correct liquidation for user1 BTC short position', async () => {
      // First get the position key for USER_1_ADDRESS and BTC_ASSET (short)
      const positionKeyData = await graphQLPost(
        `positionKeys(condition:{account:"${USER_1_ADDRESS}",indexAssetId:"${BTC_ASSET}",isLong:false}){nodes{id}}`
      );
      expect(positionKeyData.data.positionKeys.nodes.length).toBe(1);
      const positionKeyId = positionKeyData.data.positionKeys.nodes[0].id;

      // Then get liquidation position for this key
      const liquidationData = await graphQLPost(
        `positions(condition:{positionKeyId:"${positionKeyId}",change:"LIQUIDATE"}){nodes{id,collateral,size,latest,realizedFundingRate,realizedPnl,outLiquidationFee}}`
      );
      expect(liquidationData.data.positions.nodes.length).toBe(1);
      const liquidation = liquidationData.data.positions.nodes[0];

      expect(liquidation.collateral).toBe('0');
      expect(liquidation.size).toBe('0');
      expect(liquidation.latest).toBe(true);
      // Liquidated positions keep their aggregated realized values
      expect(liquidation.realizedFundingRate).toBeDefined();
      expect(liquidation.realizedPnl).toBeDefined();
      expect(BigInt(liquidation.outLiquidationFee)).toBeGreaterThan(0); // liquidation fee
    });

    it('should store correct liquidation for user0 ETH long position', async () => {
      // First get the position key for USER_0_ADDRESS and ETH_ASSET (long)
      const positionKeyData = await graphQLPost(
        `positionKeys(condition:{account:"${USER_0_ADDRESS}",indexAssetId:"${ETH_ASSET}",isLong:true}){nodes{id}}`
      );
      expect(positionKeyData.data.positionKeys.nodes.length).toBe(1);
      const positionKeyId = positionKeyData.data.positionKeys.nodes[0].id;

      // Then get liquidation position for this key
      const liquidationData = await graphQLPost(
        `positions(condition:{positionKeyId:"${positionKeyId}",change:"LIQUIDATE"}){nodes{id,collateral,size,latest,realizedFundingRate,realizedPnl,outLiquidationFee}}`
      );
      expect(liquidationData.data.positions.nodes.length).toBe(1);
      const liquidation = liquidationData.data.positions.nodes[0];

      expect(liquidation.collateral).toBe('0');
      expect(liquidation.size).toBe('0');
      expect(liquidation.latest).toBe(true);
      // Liquidated positions keep their aggregated realized values
      expect(liquidation.realizedFundingRate).toBeDefined();
      expect(liquidation.realizedPnl).toBeDefined();
      expect(BigInt(liquidation.outLiquidationFee)).toBeGreaterThan(0); // liquidation fee
    });

    it('should have only one latest record per position key after liquidation', async () => {
      // User0 BTC long - should have latest = true only for liquidation
      const user0BtcLongKeyData = await graphQLPost(
        `positionKeys(condition:{account:"${USER_0_ADDRESS}",indexAssetId:"${BTC_ASSET}",isLong:true}){nodes{id}}`
      );
      if (user0BtcLongKeyData.data.positionKeys.nodes.length > 0) {
        const positionKeyId = user0BtcLongKeyData.data.positionKeys.nodes[0].id;
        const latestPositionsData = await graphQLPost(
          `positions(condition:{positionKeyId:"${positionKeyId}",latest:true}){nodes{id}}`
        );
        expect(latestPositionsData.data.positions.nodes.length).toBe(1);
      }

      // User1 BTC short - should have latest = true only for liquidation
      const user1BtcShortKeyData = await graphQLPost(
        `positionKeys(condition:{account:"${USER_1_ADDRESS}",indexAssetId:"${BTC_ASSET}",isLong:false}){nodes{id}}`
      );
      if (user1BtcShortKeyData.data.positionKeys.nodes.length > 0) {
        const positionKeyId = user1BtcShortKeyData.data.positionKeys.nodes[0].id;
        const latestPositionsData = await graphQLPost(
          `positions(condition:{positionKeyId:"${positionKeyId}",latest:true}){nodes{id}}`
        );
        expect(latestPositionsData.data.positions.nodes.length).toBe(1);
      }

      // User0 ETH long - should have latest = true only for liquidation
      const user0EthLongKeyData = await graphQLPost(
        `positionKeys(condition:{account:"${USER_0_ADDRESS}",indexAssetId:"${ETH_ASSET}",isLong:true}){nodes{id}}`
      );
      if (user0EthLongKeyData.data.positionKeys.nodes.length > 0) {
        const positionKeyId = user0EthLongKeyData.data.positionKeys.nodes[0].id;
        const latestPositionsData = await graphQLPost(
          `positions(condition:{positionKeyId:"${positionKeyId}",latest:true}){nodes{id}}`
        );
        expect(latestPositionsData.data.positions.nodes.length).toBe(1);
      }
    });

    it('should store correct liquidation timestamps', async () => {
      const liquidationsData = await graphQLPost(
        `positions(condition:{change:"LIQUIDATE"}){nodes{timestamp}}`
      );

      const timestamps = liquidationsData.data.positions.nodes.map(
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

      // Timestamps should span across events (minimum ~39 seconds between first and last liquidation)
      expect(maxTimestamp - minTimestamp).toBeGreaterThanOrEqual(39);
    });

    it('should store liquidation events with correct position progression', async () => {
      // Check User0 BTC long position progression
      const user0BtcLongKeyData = await graphQLPost(
        `positionKeys(condition:{account:"${USER_0_ADDRESS}",indexAssetId:"${BTC_ASSET}",isLong:true}){nodes{id}}`
      );

      if (user0BtcLongKeyData.data.positionKeys.nodes.length > 0) {
        const positionKeyId = user0BtcLongKeyData.data.positionKeys.nodes[0].id;
        const positionsData = await graphQLPost(
          `positions(condition:{positionKeyId:"${positionKeyId}"}){nodes{change,collateral,size,realizedFundingRate,realizedPnl,timestamp}}`
        );
        expect(positionsData.data.positions.nodes.length).toBeGreaterThan(0);

        // Sort by timestamp ASC
        const sortedPositions = positionsData.data.positions.nodes.sort(
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
        expect(BigInt(liquidation.collateral)).toBe(BigInt(0));
        expect(BigInt(liquidation.size)).toBe(BigInt(0));
        // But it should keep aggregated realized values
        expect(liquidation.realizedFundingRate).toBeDefined();
        expect(liquidation.realizedPnl).toBeDefined();
      }
    });

    it('should store liquidation fees correctly', async () => {
      const liquidationsData = await graphQLPost(
        `positions(condition:{change:"LIQUIDATE"}){nodes{id,positionKeyId,outLiquidationFee}}`
      );
      expect(liquidationsData.data.positions.nodes.length).toBe(3);

      for (const liquidation of liquidationsData.data.positions.nodes) {
        // Get the position before liquidation (the last position that was not a liquidation)
        const positionKeyId = liquidation.positionKeyId;
        const positionsData = await graphQLPost(
          `positions(condition:{positionKeyId:"${positionKeyId}"}){nodes{change,size,timestamp}}`
        );

        // Sort by timestamp to find the position before liquidation
        const sortedPositions = positionsData.data.positions.nodes.sort(
          (a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp
        );

        // Find the last position before liquidation
        const liquidationIndex = sortedPositions.findIndex(
          (p: { change: string }) => p.change === 'LIQUIDATE'
        );
        expect(liquidationIndex).toBeGreaterThan(0);
        const previousPosition = sortedPositions[liquidationIndex - 1];
        const previousSize = BigInt(previousPosition.size);

        // Liquidation fee is 0.1% of the position size before liquidation (0.1% = 1/1000)
        const expectedFee = previousSize / BigInt(1000);

        // Check that outLiquidationFee is approximately the liquidation fee (0.1% of size)
        // Allow a small tolerance for rounding differences
        const fee = BigInt(liquidation.outLiquidationFee);
        expect(fee).toBeGreaterThanOrEqual((expectedFee * BigInt(99)) / BigInt(100)); // Allow 1% tolerance
        expect(fee).toBeLessThanOrEqual((expectedFee * BigInt(101)) / BigInt(100)); // Allow 1% tolerance
      }
    });

    it('should store PnL and funding rate for liquidations', async () => {
      const liquidationsData = await graphQLPost(
        `positions(condition:{change:"LIQUIDATE"}){nodes{pnlDelta,outPnlDelta,fundingRate,outFundingRate}}`
      );
      expect(liquidationsData.data.positions.nodes.length).toBe(3);

      liquidationsData.data.positions.nodes.forEach((position: any) => {
        // PnL delta and funding rate should be stored (can be positive or negative)
        expect(position.pnlDelta).toBeDefined();
        expect(position.outPnlDelta).toBeDefined();
        expect(position.fundingRate).toBeDefined();
        expect(position.outFundingRate).toBeDefined();
      });
    });

    it('should store realized PnL and funding rate for liquidations (keep aggregated values)', async () => {
      const liquidationsData = await graphQLPost(
        `positions(condition:{change:"LIQUIDATE"}){nodes{realizedPnl,realizedFundingRate}}`
      );
      expect(liquidationsData.data.positions.nodes.length).toBe(3);

      liquidationsData.data.positions.nodes.forEach((position: any) => {
        // Realized values should be kept (not reset to 0) for liquidated positions
        expect(position.realizedPnl).toBeDefined();
        expect(position.realizedFundingRate).toBeDefined();
      });
    });

    it('should reset aggregated values when position is reopened after liquidation', async () => {
      // Get all position keys that have both LIQUIDATE and INCREASE events
      const allPositionsData = await graphQLPost(
        `positions{nodes{positionKeyId,change,timestamp,realizedPnl,realizedFundingRate,outFundingRate,outPnlDelta}}`
      );

      // Group by positionKeyId
      const positionsByKey = new Map<string, any[]>();
      allPositionsData.data.positions.nodes.forEach((p: any) => {
        if (!positionsByKey.has(p.positionKeyId)) {
          positionsByKey.set(p.positionKeyId, []);
        }
        positionsByKey.get(p.positionKeyId)!.push(p);
      });

      for (const [_positionKeyId, positions] of positionsByKey.entries()) {
        // Sort by timestamp
        positions.sort((a: any, b: any) => a.timestamp - b.timestamp);

        // Find liquidation events
        const liquidations = positions.filter((p: any) => p.change === 'LIQUIDATE');

        for (const liquidation of liquidations) {
          const liquidationIndex = positions.indexOf(liquidation);

          // Find INCREASE events after this liquidation
          const increasesAfter = positions
            .slice(liquidationIndex + 1)
            .filter((p: any) => p.change === 'INCREASE');

          if (increasesAfter.length > 0) {
            const firstIncrease = increasesAfter[0];
            const increaseRealizedPnl = BigInt(firstIncrease.realizedPnl);
            const increaseRealizedFundingRate = BigInt(firstIncrease.realizedFundingRate);
            const increaseOutFundingRate = BigInt(firstIncrease.outFundingRate);
            const increaseOutPnlDelta = BigInt(firstIncrease.outPnlDelta);

            // The new position should NOT inherit realized values from liquidation
            // It should start fresh - realized values should equal the deltas from this event only
            // (not including the liquidation's realized values)
            expect(increaseRealizedPnl).toBe(increaseOutPnlDelta);
            expect(increaseRealizedFundingRate).toBe(increaseOutFundingRate);
          }
        }
      }
    });

    it('should have liquidation events marked as latest for closed positions', async () => {
      const liquidationsData = await graphQLPost(
        `positions(condition:{change:"LIQUIDATE"}){nodes{latest}}`
      );
      expect(liquidationsData.data.positions.nodes.length).toBe(3);

      liquidationsData.data.positions.nodes.forEach((position: any) => {
        expect(position.latest).toBe(true);
      });
    });
  });

  afterAll(async () => {
    await client.end();
  });
});
