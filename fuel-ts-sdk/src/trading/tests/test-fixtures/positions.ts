import { CollateralAmount } from '@/shared/models/decimals';
import { address, assetId, positionRevisionId, positionStableId } from '@/shared/types';
import type { Position } from '@/trading/src/positions/domain';
import { PositionChange } from '@/trading/src/positions/domain';
import {
  FundingRate,
  PnlDelta,
  PositionFee,
  PositionSize,
  RealizedPnl,
} from '@/trading/src/positions/domain/positions.decimals';

/**
 * Create a test position with default values
 */
export function createTestPosition(overrides: Partial<Position> = {}): Position {
  return {
    revisionId: positionRevisionId('test-position-revision-1'),
    positionKey: {
      id: positionStableId('0xtest-position-stable-id'),
      account: address('0x1234567890123456789012345678901234567890123456789012345678901234'),
      indexAssetId: assetId('0xbtc'),
      isLong: true,
    },
    collateralAmount: CollateralAmount.fromFloat(1000),
    size: PositionSize.fromFloat(10000),
    timestamp: Date.now(),
    latest: true,
    change: PositionChange.Increase,
    collateralTransferred: CollateralAmount.fromFloat(1000),
    positionFee: PositionFee.fromFloat(10),
    fundingRate: FundingRate.fromFloat(0.01),
    pnlDelta: PnlDelta.fromFloat(0),
    realizedFundingRate: FundingRate.fromFloat(0),
    realizedPnl: RealizedPnl.fromFloat(0),
    ...overrides,
  };
}

/**
 * Create an open long position
 */
export function createOpenLongPosition(overrides: Partial<Position> = {}): Position {
  return createTestPosition({
    positionKey: {
      id: positionStableId('0xtest-position-stable-id'),
      account: address('0x1234567890123456789012345678901234567890123456789012345678901234'),
      indexAssetId: assetId('0xbtc'),
      isLong: true,
    },
    latest: true,
    size: PositionSize.fromFloat(10000),
    ...overrides,
  });
}

/**
 * Create an open short position
 */
export function createOpenShortPosition(overrides: Partial<Position> = {}): Position {
  return createTestPosition({
    positionKey: {
      id: positionStableId('0xtest-position-stable-id'),
      account: address('0x1234567890123456789012345678901234567890123456789012345678901234'),
      indexAssetId: assetId('0xbtc'),
      isLong: false,
    },
    latest: true,
    size: PositionSize.fromFloat(10000),
    ...overrides,
  });
}

/**
 * Create a closed position
 */
export function createClosedPosition(overrides: Partial<Position> = {}): Position {
  return createTestPosition({
    change: PositionChange.Close,
    latest: false,
    size: PositionSize.fromFloat(0),
    ...overrides,
  });
}

/**
 * Create a position history (multiple position events)
 */
export function createPositionHistory(): Position[] {
  const baseTimestamp = Date.now() - 1000000;
  const stableId = positionStableId('0xposition-1-stable-id');

  return [
    createTestPosition({
      revisionId: positionRevisionId('position-1-event-1'),
      positionKey: {
        id: stableId,
        account: address('0x1234567890123456789012345678901234567890123456789012345678901234'),
        indexAssetId: assetId('0xbtc'),
        isLong: true,
      },
      timestamp: baseTimestamp,
      change: PositionChange.Increase,
      size: PositionSize.fromFloat(5000),
      collateralAmount: CollateralAmount.fromFloat(500),
      latest: false,
    }),
    createTestPosition({
      revisionId: positionRevisionId('position-1-event-2'),
      positionKey: {
        id: stableId,
        account: address('0x1234567890123456789012345678901234567890123456789012345678901234'),
        indexAssetId: assetId('0xbtc'),
        isLong: true,
      },
      timestamp: baseTimestamp + 10000,
      change: PositionChange.Increase,
      size: PositionSize.fromFloat(10000),
      collateralAmount: CollateralAmount.fromFloat(1000),
      latest: false,
    }),
    createTestPosition({
      revisionId: positionRevisionId('position-1-event-3'),
      positionKey: {
        id: stableId,
        account: address('0x1234567890123456789012345678901234567890123456789012345678901234'),
        indexAssetId: assetId('0xbtc'),
        isLong: true,
      },
      timestamp: baseTimestamp + 20000,
      change: PositionChange.Decrease,
      size: PositionSize.fromFloat(7000),
      collateralAmount: CollateralAmount.fromFloat(700),
      latest: true,
    }),
  ];
}
