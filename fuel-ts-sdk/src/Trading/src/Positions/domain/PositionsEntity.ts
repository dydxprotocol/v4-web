import type { PositionChange } from '@sdk/generated/graphql';
import type { CollateralAmount } from '@sdk/shared/models/decimals';
import type { Address, AssetId, PositionRevisionId, PositionStableId } from '@sdk/shared/types';
import type {
  FundingRate,
  PnlDelta,
  PositionFee,
  PositionSize,
  RealizedPnl,
} from './positionsDecimals';

export { PositionChange } from '@sdk/generated/graphql';

export type PositionKeyEntity = {
  id: PositionStableId;
  account: Address;
  indexAssetId: AssetId;
  isLong: boolean;
};

export type PositionEntity = {
  revisionId: PositionRevisionId;
  positionKey: PositionKeyEntity;
  collateralAmount: CollateralAmount;
  size: PositionSize;
  timestamp: number;
  latest: boolean;
  change: PositionChange;
  collateralTransferred: CollateralAmount;
  positionFee: PositionFee;
  fundingRate: FundingRate;
  pnlDelta: PnlDelta;
  realizedFundingRate: FundingRate;
  realizedPnl: RealizedPnl;
};

export enum PositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}
