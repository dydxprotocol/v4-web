import { address, assetId, positionRevisionId, positionStableId } from '@sdk/shared/types';
import type { PositionEntity } from '../../../domain';
import { PositionChange, PositionSchema, PositionSide } from '../../../domain';

export interface PositionResponse {
  id: string;
  timestamp: number;
  latest: boolean;
  change: string;
  collateralDelta: string;
  sizeDelta: string;
  pnlDelta: string;
  outLiquidityFee: string;
  outProtocolFee: string;
  outLiquidationFee: string;
  // running totals
  size: string;
  collateral: string;
  realizedPnl: string;
  outAveragePrice: string;
}

export interface PositionKeyResponse {
  id: string;
  account: string;
  indexAssetId: string;
  isLong: boolean;
  positions: { nodes: PositionResponse[] };
}

function toPositionChange(change: string): PositionChange {
  switch (change) {
    case 'CLOSE':
      return PositionChange.CLOSE;
    case 'DECREASE':
      return PositionChange.DECREASE;
    case 'INCREASE':
      return PositionChange.INCREASE;
    case 'LIQUIDATE':
      return PositionChange.LIQUIDATE;
    default:
      throw new Error(`Unknown position change type: ${change}`);
  }
}

export function toDomainPosition(
  position: PositionResponse,
  positionKey: Omit<PositionKeyResponse, 'positions'>
): PositionEntity {
  return PositionSchema.parse({
    revisionId: positionRevisionId(position.id),
    stableId: positionStableId(positionKey.id),
    side: positionKey.isLong ? PositionSide.LONG : PositionSide.SHORT,
    assetId: assetId(positionKey.indexAssetId),
    accountAddress: address(positionKey.account),

    // event-level
    isLatest: position.latest,
    change: toPositionChange(position.change),
    collateralDelta: position.collateralDelta,
    sizeDelta: position.sizeDelta,
    pnlDelta: position.pnlDelta,
    outLiquidityFee: position.outLiquidityFee,
    outProtocolFee: position.outProtocolFee,
    outLiquidationFee: position.outLiquidationFee,
    timestamp: position.timestamp,

    // running totals
    size: position.size,
    collateral: position.collateral,
    realizedPnl: position.realizedPnl,
    entryPrice: position.outAveragePrice,
  });
}
