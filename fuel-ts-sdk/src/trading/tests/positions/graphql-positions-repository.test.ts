import { beforeEach, describe, expect, it } from 'vitest';
import { createMockGraphQLClient } from '@/shared/test-helpers';
import { address, positionRevisionId } from '@/shared/types';
import type { Position } from '@/trading/src/positions/domain';
import { getPositionsByAccount } from '@/trading/src/positions/infrastructure/repositories/graphql-positions-repository/get-positions-by-account';
import { createTestPosition } from '../test-fixtures/positions';

describe('GraphQLPositionsRepository', () => {
  let mockClient: ReturnType<typeof createMockGraphQLClient>;

  beforeEach(() => {
    mockClient = createMockGraphQLClient();
  });

  describe('getPositionsByAccount', () => {
    it('should fetch positions from GraphQL', async () => {
      const mockPositions: Position[] = [
        createTestPosition({ revisionId: positionRevisionId('pos-1') }),
        createTestPosition({ revisionId: positionRevisionId('pos-2') }),
      ];

      const testAccount = address(
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      );

      // Mock the first query: GetPositionKeysByAccount
      mockClient.mockResponse('GetPositionKeysByAccount', {
        positionKeys: {
          nodes: [
            { id: 'key-1' },
            { id: 'key-2' },
          ],
        },
      });

      // Mock the second query: GetPositionsByKeyIds
      mockClient.mockResponse('GetPositionsByKeyIds', {
        positions: {
          nodes: mockPositions.map((p) => ({
            id: p.revisionId,
            positionKey: {
              id: p.positionKey.id,
              account: p.positionKey.account,
              indexAssetId: p.positionKey.indexAssetId,
              isLong: p.positionKey.isLong,
            },
            collateralAmount: p.collateralAmount.value.toString(),
            size: p.size.value.toString(),
            timestamp: p.timestamp,
            latest: p.latest,
            change: p.change,
            collateralTransferred: p.collateralTransferred.value.toString(),
            positionFee: p.positionFee.value.toString(),
            fundingRate: p.fundingRate.value.toString(),
            pnlDelta: p.pnlDelta.value.toString(),
            realizedFundingRate: p.realizedFundingRate.value.toString(),
            realizedPnl: p.realizedPnl.value.toString(),
          })),
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

      // Mock empty position keys
      mockClient.mockResponse('GetPositionKeysByAccount', {
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

      // Mock the first query: GetPositionKeysByAccount
      mockClient.mockResponse('GetPositionKeysByAccount', {
        positionKeys: {
          nodes: [{ id: 'key-1' }],
        },
      });

      // Mock the second query: GetPositionsByKeyIds
      mockClient.mockResponse('GetPositionsByKeyIds', {
        positions: {
          nodes: [
            {
              id: mockPosition.revisionId,
              positionKey: {
                id: mockPosition.positionKey.id,
                account: mockPosition.positionKey.account,
                indexAssetId: mockPosition.positionKey.indexAssetId,
                isLong: mockPosition.positionKey.isLong,
              },
              collateralAmount: mockPosition.collateralAmount.value.toString(),
              size: mockPosition.size.value.toString(),
              timestamp: mockPosition.timestamp,
              latest: mockPosition.latest,
              change: mockPosition.change,
              collateralTransferred: mockPosition.collateralTransferred.value.toString(),
              positionFee: mockPosition.positionFee.value.toString(),
              fundingRate: mockPosition.fundingRate.value.toString(),
              pnlDelta: mockPosition.pnlDelta.value.toString(),
              realizedFundingRate: mockPosition.realizedFundingRate.value.toString(),
              realizedPnl: mockPosition.realizedPnl.value.toString(),
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
