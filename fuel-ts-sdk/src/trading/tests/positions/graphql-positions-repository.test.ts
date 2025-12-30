import { beforeEach, describe, expect, it } from 'vitest';
import { createMockGraphQLClient } from '@/shared/test-helpers';
import { positionId } from '@/shared/types';
import type { Position } from '@/trading/src/positions/domain';
import { getPositions } from '@/trading/src/positions/infrastructure/repositories/graphql-positions-repository/get-positions';
import { createTestPosition } from '../test-fixtures/positions';

describe('GraphQLPositionsRepository', () => {
  let mockClient: ReturnType<typeof createMockGraphQLClient>;

  beforeEach(() => {
    mockClient = createMockGraphQLClient();
  });

  describe('getPositions', () => {
    it('should fetch positions from GraphQL', async () => {
      const mockPositions: Position[] = [
        createTestPosition({ id: positionId('pos-1') }),
        createTestPosition({ id: positionId('pos-2') }),
      ];

      mockClient.mockResponse('GetPositions', {
        positions: mockPositions.map((p) => ({
          ...p,
          collateralAmount: p.collateralAmount.value.toString(),
          size: p.size.value.toString(),
          collateralTransferred: p.collateralTransferred.value.toString(),
          positionFee: p.positionFee.value.toString(),
          fundingRate: p.fundingRate.value.toString(),
          pnlDelta: p.pnlDelta.value.toString(),
          realizedFundingRate: p.realizedFundingRate.value.toString(),
          realizedPnl: p.realizedPnl.value.toString(),
        })),
      });

      const positions = await getPositions(mockClient as any)();

      expect(positions).toHaveLength(2);
      expect(positions[0].id).toBe('pos-1');
      expect(positions[1].id).toBe('pos-2');
    });

    it('should handle empty results', async () => {
      mockClient.mockResponse('GetPositions', {
        positions: [],
      });

      const positions = await getPositions(mockClient as any)();

      expect(positions).toEqual([]);
    });

    it('should convert GraphQL response to domain entities', async () => {
      const mockPosition = createTestPosition({ id: positionId('pos-1') });

      mockClient.mockResponse('GetPositions', {
        positions: [
          {
            ...mockPosition,
            collateralAmount: mockPosition.collateralAmount.value.toString(),
            size: mockPosition.size.value.toString(),
            collateralTransferred: mockPosition.collateralTransferred.value.toString(),
            positionFee: mockPosition.positionFee.value.toString(),
            fundingRate: mockPosition.fundingRate.value.toString(),
            pnlDelta: mockPosition.pnlDelta.value.toString(),
            realizedFundingRate: mockPosition.realizedFundingRate.value.toString(),
            realizedPnl: mockPosition.realizedPnl.value.toString(),
          },
        ],
      });

      const positions = await getPositions(mockClient as any)();

      expect(positions[0]).toBeDefined();
      expect(positions[0].id).toBe('pos-1');
      // Verify decimal values are properly converted
      expect(positions[0].collateralAmount.value).toBeDefined();
      expect(positions[0].size.value).toBeDefined();
    });
  });
});
