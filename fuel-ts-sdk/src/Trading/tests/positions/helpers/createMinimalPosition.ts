import { CollateralAmount, OraclePrice } from '@sdk/shared/models/decimals';
import { address, assetId, positionRevisionId, positionStableId } from '@sdk/shared/types';
import type { PositionEntity } from '../../../src/Positions/domain/PositionsEntity';
import { PositionChange, PositionSide } from '../../../src/Positions/domain/PositionsEntity';
import { PositionSize } from '../../../src/Positions/domain/positionsDecimals';

type MinimalPositionOverrides = Partial<
  Pick<
    PositionEntity,
    | 'side'
    | 'size'
    | 'entryPrice'
    | 'collateral'
    | 'isLatest'
    | 'stableId'
    | 'revisionId'
    | 'accountAddress'
  >
>;

let revisionCounter = 0;

/**
 * Creates a minimal position entity with only the fields needed for calculations.
 * Use this for testing domain calculations that don't need all entity fields.
 */
export function createMinimalPosition(overrides: MinimalPositionOverrides = {}): PositionEntity {
  const uniqueRevisionId =
    overrides.revisionId ?? positionRevisionId(`test-rev-${++revisionCounter}`);
  return {
    revisionId: uniqueRevisionId,
    stableId: overrides.stableId ?? positionStableId('test-stable-1'),
    side: overrides.side ?? PositionSide.LONG,
    assetId: assetId('0xbtc'),
    accountAddress:
      overrides.accountAddress ??
      address('0x1234567890123456789012345678901234567890123456789012345678901234'),

    isLatest: overrides.isLatest ?? true,
    change: PositionChange.INCREASE,
    collateralDelta: CollateralAmount.fromFloat(0),
    sizeDelta: PositionSize.fromFloat(0),
    pnlDelta: CollateralAmount.fromFloat(0),
    outLiquidityFee: CollateralAmount.fromFloat(0),
    outProtocolFee: CollateralAmount.fromFloat(0),
    outLiquidationFee: CollateralAmount.fromFloat(0),
    timestamp: Date.now(),

    size: overrides.size ?? PositionSize.fromFloat(10000),
    collateral: overrides.collateral ?? CollateralAmount.fromFloat(1000),
    realizedPnl: CollateralAmount.fromFloat(0),
    entryPrice: overrides.entryPrice ?? OraclePrice.fromFloat(50000),
  };
}
