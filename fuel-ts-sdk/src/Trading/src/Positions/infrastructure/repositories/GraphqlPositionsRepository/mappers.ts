import { address, assetId, positionRevisionId, positionStableId } from '@sdk/shared/types';
import type { PositionEntity } from '../../../domain';
import { PositionSchema } from '../../../domain';

export interface NestedPositionResponse {
  id: string;
  collateral: string;
  size: string;
  timestamp: number;
  latest: boolean;
  change: string;
  collateralDelta: string;
  outLiquidityFee: string;
  outProtocolFee: string;
  outLiquidationFee: string;
  fundingRate: string;
  pnlDelta: string;
  realizedFundingRate: string;
  realizedPnl: string;
}

export interface NestedPositionKeyResponse {
  id: string;
  account: string;
  indexAssetId: string;
  isLong: boolean;
  positions: { nodes: NestedPositionResponse[] };
}

export function toDomainPosition(
  position: NestedPositionResponse,
  positionKey: Omit<NestedPositionKeyResponse, 'positions'>
): PositionEntity {
  const positionFee =
    BigInt(position.outLiquidityFee) +
    BigInt(position.outProtocolFee) +
    BigInt(position.outLiquidationFee);

  return PositionSchema.parse({
    revisionId: positionRevisionId(position.id),
    positionKey: {
      id: positionStableId(positionKey.id),
      account: address(positionKey.account),
      indexAssetId: assetId(positionKey.indexAssetId),
      isLong: positionKey.isLong,
    },
    collateralAmount: position.collateral,
    size: position.size,
    timestamp: position.timestamp,
    latest: position.latest,
    change: position.change,
    collateralTransferred: position.collateralDelta,
    positionFee: positionFee.toString(),
    fundingRate: position.fundingRate,
    pnlDelta: position.pnlDelta,
    realizedFundingRate: position.realizedFundingRate,
    realizedPnl: position.realizedPnl,
  });
}
