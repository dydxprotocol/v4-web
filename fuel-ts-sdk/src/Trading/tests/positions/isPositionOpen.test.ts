import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { RootState } from '@sdk/shared/lib/redux';
import { positionStableId } from '@sdk/shared/types';
import { describe, expect, it, vi } from 'vitest';
import { createIsPositionOpenQuery } from '../../src/Positions/application/queries/isPositionOpen';
import { PositionSize } from '../../src/Positions/domain/positionsDecimals';
import { createMinimalPosition } from './helpers/createMinimalPosition';

function createMockStoreService(
  positions: ReturnType<typeof createMinimalPosition>[]
): StoreService {
  const state = {
    trading: {
      positions: {
        positions: {
          ids: positions.map((p) => p.revisionId),
          entities: Object.fromEntries(positions.map((p) => [p.revisionId, p])),
        },
      },
    },
  } as unknown as RootState;

  return {
    dispatch: vi.fn(),
    select: vi.fn((selector) => selector(state)),
    getState: vi.fn(() => state),
  };
}

describe('isPositionOpen query', () => {
  const testStableId = positionStableId('test-stable-1');

  it('should return true for position with non-zero size', () => {
    const position = createMinimalPosition({
      stableId: testStableId,
      size: PositionSize.fromFloat(10000),
      isLatest: true,
    });
    const storeService = createMockStoreService([position]);
    const isPositionOpen = createIsPositionOpenQuery({ storeService });

    const result = isPositionOpen(testStableId);

    expect(result).toBe(true);
  });

  it('should return false for position with zero size', () => {
    const position = createMinimalPosition({
      stableId: testStableId,
      size: PositionSize.fromFloat(0),
      isLatest: true,
    });
    const storeService = createMockStoreService([position]);
    const isPositionOpen = createIsPositionOpenQuery({ storeService });

    const result = isPositionOpen(testStableId);

    expect(result).toBe(false);
  });

  it('should return false for non-existent position', () => {
    const storeService = createMockStoreService([]);
    const isPositionOpen = createIsPositionOpenQuery({ storeService });

    const result = isPositionOpen(positionStableId('non-existent'));

    expect(result).toBe(false);
  });

  it('should only consider latest position', () => {
    const oldPosition = createMinimalPosition({
      stableId: testStableId,
      size: PositionSize.fromFloat(10000),
      isLatest: false,
    });
    const storeService = createMockStoreService([oldPosition]);
    const isPositionOpen = createIsPositionOpenQuery({ storeService });

    // selectLatestPositionByStableId should not find this since isLatest is false
    const result = isPositionOpen(testStableId);

    expect(result).toBe(false);
  });
});
