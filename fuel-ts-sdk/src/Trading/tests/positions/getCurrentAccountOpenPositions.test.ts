import type { WalletQueries } from '@sdk/Accounts';
import { address, positionStableId } from '@sdk/shared/types';
import { describe, expect, it, vi } from 'vitest';
import type { PositionsQueries } from '../../src/Positions';
import { PositionSize } from '../../src/Positions/domain/positionsDecimals';
import { createGetCurrentAccountOpenPositionsQuery } from '../../src/application/queries/getCurrentAccountOpenPositions';
import { createMinimalPosition } from './helpers/createMinimalPosition';

const testUserAddress = address(
  '0x1234567890123456789012345678901234567890123456789012345678901234'
);
const otherUserAddress = address(
  '0xabcdef1234567890123456789012345678901234567890123456789012345678'
);

function createMockDeps(options: {
  currentUserAddress: ReturnType<WalletQueries['getCurrentUserAddress']>;
  positions: ReturnType<typeof createMinimalPosition>[];
  openPositionStableIds: Set<string>;
}) {
  const openIds = options.openPositionStableIds;
  const latestPositions = options.positions.filter((p) => p.isLatest);

  const positionsQueries: PositionsQueries = {
    getAllLatestPositions: vi.fn(() => latestPositions),
    isPositionOpen: vi.fn((stableId) => openIds.has(stableId)),
    getPositionById: vi.fn(),
  };

  const walletQueries: WalletQueries = {
    getCurrentUserAddress: vi.fn(() => options.currentUserAddress),
    getCurrentUserAssetBalance: vi.fn(),
    getCurrentUserBalances: vi.fn(),
    getCurrentUserDataFetchStatus: vi.fn(),
  };

  return { positionsQueries, walletQueries };
}

describe('getCurrentAccountOpenPositions query', () => {
  it('should return open positions for current user', () => {
    const stableId1 = positionStableId('pos-1');
    const stableId2 = positionStableId('pos-2');
    const position1 = createMinimalPosition({
      stableId: stableId1,
      accountAddress: testUserAddress,
      size: PositionSize.fromFloat(10000),
      isLatest: true,
    });
    const position2 = createMinimalPosition({
      stableId: stableId2,
      accountAddress: testUserAddress,
      size: PositionSize.fromFloat(5000),
      isLatest: true,
    });
    const deps = createMockDeps({
      currentUserAddress: testUserAddress,
      positions: [position1, position2],
      openPositionStableIds: new Set([stableId1, stableId2]),
    });
    const getCurrentAccountOpenPositions = createGetCurrentAccountOpenPositionsQuery(deps);

    const result = getCurrentAccountOpenPositions();

    expect(result).toHaveLength(2);
    expect(result).toContain(position1);
    expect(result).toContain(position2);
  });

  it('should filter out positions from other accounts', () => {
    const userStableId = positionStableId('user-pos');
    const otherStableId = positionStableId('other-pos');
    const userPosition = createMinimalPosition({
      stableId: userStableId,
      accountAddress: testUserAddress,
      size: PositionSize.fromFloat(10000),
      isLatest: true,
    });
    const otherPosition = createMinimalPosition({
      stableId: otherStableId,
      accountAddress: otherUserAddress,
      size: PositionSize.fromFloat(5000),
      isLatest: true,
    });
    const deps = createMockDeps({
      currentUserAddress: testUserAddress,
      positions: [userPosition, otherPosition],
      openPositionStableIds: new Set([userStableId, otherStableId]),
    });
    const getCurrentAccountOpenPositions = createGetCurrentAccountOpenPositionsQuery(deps);

    const result = getCurrentAccountOpenPositions();

    expect(result).toHaveLength(1);
    expect(result).toContain(userPosition);
    expect(result).not.toContain(otherPosition);
  });

  it('should filter out closed positions', () => {
    const openStableId = positionStableId('open-pos');
    const closedStableId = positionStableId('closed-pos');
    const openPosition = createMinimalPosition({
      stableId: openStableId,
      accountAddress: testUserAddress,
      size: PositionSize.fromFloat(10000),
      isLatest: true,
    });
    const closedPosition = createMinimalPosition({
      stableId: closedStableId,
      accountAddress: testUserAddress,
      size: PositionSize.fromFloat(0),
      isLatest: true,
    });
    const deps = createMockDeps({
      currentUserAddress: testUserAddress,
      positions: [openPosition, closedPosition],
      openPositionStableIds: new Set([openStableId]),
    });
    const getCurrentAccountOpenPositions = createGetCurrentAccountOpenPositionsQuery(deps);

    const result = getCurrentAccountOpenPositions();

    expect(result).toHaveLength(1);
    expect(result).toContain(openPosition);
    expect(result).not.toContain(closedPosition);
  });

  it('should return empty array when user is not connected', () => {
    const stableId = positionStableId('pos-1');
    const position = createMinimalPosition({
      stableId: stableId,
      accountAddress: testUserAddress,
      size: PositionSize.fromFloat(10000),
      isLatest: true,
    });
    const deps = createMockDeps({
      currentUserAddress: undefined,
      positions: [position],
      openPositionStableIds: new Set([stableId]),
    });
    const getCurrentAccountOpenPositions = createGetCurrentAccountOpenPositionsQuery(deps);

    const result = getCurrentAccountOpenPositions();

    expect(result).toEqual([]);
  });

  it('should return empty array when user has no positions', () => {
    const otherStableId = positionStableId('other-pos');
    const otherPosition = createMinimalPosition({
      stableId: otherStableId,
      accountAddress: otherUserAddress,
      size: PositionSize.fromFloat(10000),
      isLatest: true,
    });
    const deps = createMockDeps({
      currentUserAddress: testUserAddress,
      positions: [otherPosition],
      openPositionStableIds: new Set([otherStableId]),
    });
    const getCurrentAccountOpenPositions = createGetCurrentAccountOpenPositionsQuery(deps);

    const result = getCurrentAccountOpenPositions();

    expect(result).toEqual([]);
  });

  it('should memoize results for same inputs', () => {
    const stableId = positionStableId('pos-1');
    const position = createMinimalPosition({
      stableId: stableId,
      accountAddress: testUserAddress,
      size: PositionSize.fromFloat(10000),
      isLatest: true,
    });
    const deps = createMockDeps({
      currentUserAddress: testUserAddress,
      positions: [position],
      openPositionStableIds: new Set([stableId]),
    });
    const getCurrentAccountOpenPositions = createGetCurrentAccountOpenPositionsQuery(deps);

    const result1 = getCurrentAccountOpenPositions();
    const result2 = getCurrentAccountOpenPositions();

    expect(result1).toBe(result2);
  });
});
