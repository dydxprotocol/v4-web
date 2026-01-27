import type { CollateralAmount, OraclePrice } from '@sdk/shared/models/decimals';
import type { Address, AssetId, PositionRevisionId, PositionStableId } from '@sdk/shared/types';
import type { PositionSize } from './positionsDecimals';

export type PositionEntity = {
  revisionId: PositionRevisionId;
  stableId: PositionStableId;
  side: PositionSide;
  assetId: AssetId;
  accountAddress: Address;

  // event-level
  isLatest: boolean;
  change: PositionChange;
  collateralDelta: CollateralAmount;
  sizeDelta: PositionSize;
  pnlDelta: CollateralAmount;
  outLiquidityFee: CollateralAmount; // TODO: verify these collaterals
  outProtocolFee: CollateralAmount;
  outLiquidationFee: CollateralAmount;
  timestamp: number;

  // running totals
  size: PositionSize;
  collateral: CollateralAmount;
  realizedPnl: CollateralAmount; // TODO: verify decimal precision
  entryPrice: OraclePrice;
};

export enum PositionChange {
  CLOSE = 'CLOSE',
  DECREASE = 'DECREASE',
  INCREASE = 'INCREASE',
  LIQUIDATE = 'LIQUIDATE',
}

export enum PositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}
