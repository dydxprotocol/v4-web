import type { PositionEntity } from '@sdk/Trading/src/Positions/domain';
import { getPositionsByAccount } from '@sdk/Trading/src/Positions/infrastructure/repositories/GraphqlPositionsRepository/getPositionsByAccount';
import { createMockGraphQLClient } from '@sdk/shared/test-helpers';
import { address, positionRevisionId } from '@sdk/shared/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestPosition } from '../test-fixtures/positions';

describe('GraphQLPositionsRepository', () => {
  let mockClient: ReturnType<typeof createMockGraphQLClient>;

  beforeEach(() => {
    mockClient = createMockGraphQLClient();
  });

  describe('getPositionsByAccount', () => {
    it('should fetch positions from GraphQL', async () => {
      const mockPositions: PositionEntity[] = [
        createTestPosition({ revisionId: positionRevisionId('pos-1') }),
        createTestPosition({ revisionId: positionRevisionId('pos-2') }),
      ];

      const testAccount = address(
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      );

      mockClient.mockResponse('GetPositionsByAccount', {
        positionKeys: {
          nodes: [
            {
              id: mockPositions[0].positionKey.id,
              account: mockPositions[0].positionKey.account,
              indexAssetId: mockPositions[0].positionKey.indexAssetId,
              isLong: mockPositions[0].positionKey.isLong,
              positions: {
                nodes: [
                  {
                    id: mockPositions[0].revisionId,
                    collateral: mockPositions[0].collateralAmount.value.toString(),
                    size: mockPositions[0].size.value.toString(),
                    timestamp: mockPositions[0].timestamp,
                    latest: mockPositions[0].latest,
                    change: mockPositions[0].change,
                    collateralDelta: mockPositions[0].collateralTransferred.value.toString(),
                    outLiquidityFee: '0',
                    outProtocolFee: '0',
                    outLiquidationFee: mockPositions[0].positionFee.value.toString(),
                    fundingRate: mockPositions[0].fundingRate.value.toString(),
                    pnlDelta: mockPositions[0].pnlDelta.value.toString(),
                    realizedFundingRate: mockPositions[0].realizedFundingRate.value.toString(),
                    realizedPnl: mockPositions[0].realizedPnl.value.toString(),
                  },
                ],
              },
            },
            {
              id: mockPositions[1].positionKey.id,
              account: mockPositions[1].positionKey.account,
              indexAssetId: mockPositions[1].positionKey.indexAssetId,
              isLong: mockPositions[1].positionKey.isLong,
              positions: {
                nodes: [
                  {
                    id: mockPositions[1].revisionId,
                    collateral: mockPositions[1].collateralAmount.value.toString(),
                    size: mockPositions[1].size.value.toString(),
                    timestamp: mockPositions[1].timestamp,
                    latest: mockPositions[1].latest,
                    change: mockPositions[1].change,
                    collateralDelta: mockPositions[1].collateralTransferred.value.toString(),
                    outLiquidityFee: '0',
                    outProtocolFee: '0',
                    outLiquidationFee: mockPositions[1].positionFee.value.toString(),
                    fundingRate: mockPositions[1].fundingRate.value.toString(),
                    pnlDelta: mockPositions[1].pnlDelta.value.toString(),
                    realizedFundingRate: mockPositions[1].realizedFundingRate.value.toString(),
                    realizedPnl: mockPositions[1].realizedPnl.value.toString(),
                  },
                ],
              },
            },
          ],
        },
      });

      const positions = await getPositionsByAccount(mockClient as any)(testAccount);

      expect(positions).toHaveLength(2);
      expect(positions[0].revisionId).toBe('pos-1');
      expect(positions[1].revisionId).toBe('pos-2');
    });

    it('should handle empty results', async () => {
      const testAccount = address(
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      );

      mockClient.mockResponse('GetPositionsByAccount', {
        positionKeys: {
          nodes: [],
        },
      });

      const positions = await getPositionsByAccount(mockClient as any)(testAccount);

      expect(positions).toEqual([]);
    });

    it('should convert GraphQL response to domain entities', async () => {
      const mockPosition = createTestPosition({ revisionId: positionRevisionId('pos-1') });
      const testAccount = address(
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      );

      mockClient.mockResponse('GetPositionsByAccount', {
        positionKeys: {
          nodes: [
            {
              id: mockPosition.positionKey.id,
              account: mockPosition.positionKey.account,
              indexAssetId: mockPosition.positionKey.indexAssetId,
              isLong: mockPosition.positionKey.isLong,
              positions: {
                nodes: [
                  {
                    id: mockPosition.revisionId,
                    collateral: mockPosition.collateralAmount.value.toString(),
                    size: mockPosition.size.value.toString(),
                    timestamp: mockPosition.timestamp,
                    latest: mockPosition.latest,
                    change: mockPosition.change,
                    collateralDelta: mockPosition.collateralTransferred.value.toString(),
                    outLiquidityFee: '0',
                    outProtocolFee: '0',
                    outLiquidationFee: mockPosition.positionFee.value.toString(),
                    fundingRate: mockPosition.fundingRate.value.toString(),
                    pnlDelta: mockPosition.pnlDelta.value.toString(),
                    realizedFundingRate: mockPosition.realizedFundingRate.value.toString(),
                    realizedPnl: mockPosition.realizedPnl.value.toString(),
                  },
                ],
              },
            },
          ],
        },
      });

      const positions = await getPositionsByAccount(mockClient as any)(testAccount);

      expect(positions[0]).toBeDefined();
      expect(positions[0].revisionId).toBe('pos-1');
      // Verify decimal values are properly converted
      expect(positions[0].collateralAmount.value).toBeDefined();
      expect(positions[0].size.value).toBeDefined();
    });
  });
});
