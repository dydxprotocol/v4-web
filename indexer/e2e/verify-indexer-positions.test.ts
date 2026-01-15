import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BNB_ASSET, BTC_ASSET, USER_0_ADDRESS } from './utils';

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
      'SELECT id FROM position WHERE size = 0 AND collateral <> 0'
    );
    expect(closedPositionResult.rows.length).toBe(0);
  });

  it('should positions with no collateral have no size', async () => {
    const closedPositionResult = await client.query(
      'SELECT id FROM position WHERE collateral = 0 AND size <> 0'
    );
    expect(closedPositionResult.rows.length).toBe(0);
  });

  it('should have aggregated values for positions', async () => {
    // Check that latest positions have aggregated values
    const latestPositions = await client.query(
      'SELECT collateral, size, realized_funding_rate, realized_pnl, change FROM position WHERE latest = true'
    );
    expect(latestPositions.rows.length).toBeGreaterThan(0);

    latestPositions.rows.forEach((row: any) => {
      // All positions should have aggregated values defined
      expect(row.collateral).toBeDefined();
      expect(row.size).toBeDefined();
      expect(row.realized_funding_rate).toBeDefined();
      expect(row.realized_pnl).toBeDefined();

      // If position is in final status (CLOSE or LIQUIDATE), collateral and size should be 0
      // but they keep their aggregated realized values
      if (row.change === 'CLOSE' || row.change === 'LIQUIDATE') {
        expect(row.collateral).toBe('0');
        expect(row.size).toBe('0');
        // But realized values should be kept (not reset to 0)
        expect(row.realized_funding_rate).toBeDefined();
        expect(row.realized_pnl).toBeDefined();
      }
    });
  });

  it('should reset aggregated values when position is reopened after final status', async () => {
    // Check if any position was reopened after CLOSE or LIQUIDATE
    // Get all position keys that have both final status and INCREASE events
    const reopenedPositions = await client.query(`
      SELECT DISTINCT pk.id as position_key_id
      FROM position_key pk
      INNER JOIN position p1 ON p1.position_key_id = pk.id AND p1.change IN ('CLOSE', 'LIQUIDATE')
      INNER JOIN position p2 ON p2.position_key_id = pk.id AND p2.change = 'INCREASE' AND p2.timestamp > p1.timestamp
    `);

    for (const row of reopenedPositions.rows) {
      const positionKeyId = row.position_key_id;

      // Get the final status record (CLOSE or LIQUIDATE)
      const finalStatus = await client.query(
        'SELECT realized_pnl, realized_funding_rate, change FROM position WHERE position_key_id = $1 AND change IN ($2, $3) ORDER BY timestamp DESC LIMIT 1',
        [positionKeyId, 'CLOSE', 'LIQUIDATE']
      );

      if (finalStatus.rows.length > 0) {
        // Get the first INCREASE position after final status
        const increaseAfterFinal = await client.query(
          'SELECT realized_pnl, realized_funding_rate, out_funding_rate, out_pnl_delta FROM position WHERE position_key_id = $1 AND change = $2 AND timestamp > (SELECT timestamp FROM position WHERE position_key_id = $1 AND change IN ($3, $4) ORDER BY timestamp DESC LIMIT 1) ORDER BY timestamp ASC LIMIT 1',
          [positionKeyId, 'INCREASE', 'CLOSE', 'LIQUIDATE']
        );

        if (increaseAfterFinal.rows.length > 0) {
          const increaseRealizedPnl = BigInt(increaseAfterFinal.rows[0].realized_pnl);
          const increaseRealizedFundingRate = BigInt(
            increaseAfterFinal.rows[0].realized_funding_rate
          );
          const increaseOutFundingRate = BigInt(increaseAfterFinal.rows[0].out_funding_rate);
          const increaseOutPnlDelta = BigInt(increaseAfterFinal.rows[0].out_pnl_delta);

          // The new position should NOT inherit realized values from final status position
          // It should start fresh - realized values should equal the deltas from this event only
          expect(increaseRealizedPnl).toBe(increaseOutPnlDelta);
          expect(increaseRealizedFundingRate).toBe(increaseOutFundingRate);
        }
      }
    }
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
      const allPositionsData = await graphQLPost(`positions{nodes{id,size,collateral}}`);

      // Filter positions with size 0
      const positionsWithNoSize = allPositionsData.data.positions.nodes.filter(
        (p: { size: string }) => p.size === '0'
      );

      // All should have collateral 0
      positionsWithNoSize.forEach((position: { collateral: string }) => {
        expect(position.collateral).toBe('0');
      });
    });

    it('should positions with no collateral have no size', async () => {
      const allPositionsData = await graphQLPost(`positions{nodes{id,size,collateral}}`);

      // Filter positions with collateral 0
      const positionsWithNoCollateral = allPositionsData.data.positions.nodes.filter(
        (p: { collateral: string }) => p.collateral === '0'
      );

      // All should have size 0
      positionsWithNoCollateral.forEach((position: { size: string }) => {
        expect(position.size).toBe('0');
      });
    });

    it('should have aggregated values for positions', async () => {
      // Check that latest positions have aggregated values
      const latestPositionsData = await graphQLPost(
        `positions(condition:{latest:true}){nodes{collateral,size,realizedFundingRate,realizedPnl,change}}`
      );
      expect(latestPositionsData.data.positions.nodes.length).toBeGreaterThan(0);

      latestPositionsData.data.positions.nodes.forEach((position: any) => {
        // All positions should have aggregated values defined
        expect(position.collateral).toBeDefined();
        expect(position.size).toBeDefined();
        expect(position.realizedFundingRate).toBeDefined();
        expect(position.realizedPnl).toBeDefined();

        // If position is in final status (CLOSE or LIQUIDATE), collateral and size should be 0
        // but they keep their aggregated realized values
        if (position.change === 'CLOSE' || position.change === 'LIQUIDATE') {
          expect(position.collateral).toBe('0');
          expect(position.size).toBe('0');
          // But realized values should be kept (not reset to 0)
          expect(position.realizedFundingRate).toBeDefined();
          expect(position.realizedPnl).toBeDefined();
        }
      });
    });

    it('should reset aggregated values when position is reopened after final status', async () => {
      // Get all position keys that have both final status (CLOSE/LIQUIDATE) and INCREASE events
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

        // Find final status events (CLOSE or LIQUIDATE)
        const finalStatusEvents = positions.filter(
          (p: any) => p.change === 'CLOSE' || p.change === 'LIQUIDATE'
        );

        for (const finalStatus of finalStatusEvents) {
          const finalStatusIndex = positions.indexOf(finalStatus);

          // Find INCREASE events after this final status
          const increasesAfter = positions
            .slice(finalStatusIndex + 1)
            .filter((p: any) => p.change === 'INCREASE');

          if (increasesAfter.length > 0) {
            const firstIncrease = increasesAfter[0];
            const increaseRealizedPnl = BigInt(firstIncrease.realizedPnl);
            const increaseRealizedFundingRate = BigInt(firstIncrease.realizedFundingRate);
            const increaseOutFundingRate = BigInt(firstIncrease.outFundingRate);
            const increaseOutPnlDelta = BigInt(firstIncrease.outPnlDelta);

            // The new position should NOT inherit realized values from final status position
            // It should start fresh - realized values should equal the deltas from this event only
            expect(increaseRealizedPnl).toBe(increaseOutPnlDelta);
            expect(increaseRealizedFundingRate).toBe(increaseOutFundingRate);
          }
        }
      }
    });
  });

  afterAll(async () => {
    await client.end();
  });
});
