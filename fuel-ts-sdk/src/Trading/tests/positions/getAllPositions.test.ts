import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { RootState } from '@sdk/shared/lib/redux';
import { describe, expect, it, vi } from 'vitest';
import { createGetAllLatestPositionsQuery } from '../../src/Positions/application/queries/getAllPositions';
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

describe('getAllLatestPositions query', () => {
  it('should return all latest positions', () => {
    const position1 = createMinimalPosition({
      size: PositionSize.fromFloat(10000),
      isLatest: true,
    });
    const position2 = createMinimalPosition({
      size: PositionSize.fromFloat(5000),
      isLatest: true,
    });
    const storeService = createMockStoreService([position1, position2]);
    const getAllLatestPositions = createGetAllLatestPositionsQuery({ storeService });

    const result = getAllLatestPositions();

    expect(result).toHaveLength(2);
    expect(result).toContain(position1);
    expect(result).toContain(position2);
  });

  it('should filter out non-latest positions', () => {
    const latestPosition = createMinimalPosition({
      size: PositionSize.fromFloat(10000),
      isLatest: true,
    });
    const oldPosition = createMinimalPosition({
      size: PositionSize.fromFloat(5000),
      isLatest: false,
    });
    const storeService = createMockStoreService([latestPosition, oldPosition]);
    const getAllLatestPositions = createGetAllLatestPositionsQuery({ storeService });

    const result = getAllLatestPositions();

    expect(result).toHaveLength(1);
    expect(result).toContain(latestPosition);
    expect(result).not.toContain(oldPosition);
  });

  it('should return empty array when no positions exist', () => {
    const storeService = createMockStoreService([]);
    const getAllLatestPositions = createGetAllLatestPositionsQuery({ storeService });

    const result = getAllLatestPositions();

    expect(result).toEqual([]);
  });

  it('should return empty array when all positions are non-latest', () => {
    const oldPosition1 = createMinimalPosition({
      size: PositionSize.fromFloat(10000),
      isLatest: false,
    });
    const oldPosition2 = createMinimalPosition({
      size: PositionSize.fromFloat(5000),
      isLatest: false,
    });
    const storeService = createMockStoreService([oldPosition1, oldPosition2]);
    const getAllLatestPositions = createGetAllLatestPositionsQuery({ storeService });

    const result = getAllLatestPositions();

    expect(result).toEqual([]);
  });

  it('should memoize results for same input', () => {
    const position = createMinimalPosition({
      size: PositionSize.fromFloat(10000),
      isLatest: true,
    });
    const storeService = createMockStoreService([position]);
    const getAllLatestPositions = createGetAllLatestPositionsQuery({ storeService });

    const result1 = getAllLatestPositions();
    const result2 = getAllLatestPositions();

    expect(result1).toBe(result2);
  });
});
