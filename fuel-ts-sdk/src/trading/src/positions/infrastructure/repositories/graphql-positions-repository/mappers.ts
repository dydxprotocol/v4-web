import type { Position as GraphQLPosition } from '@/generated/graphql';
import { CollateralAmount } from '@/shared/models/decimals';
import { address, assetId, positionRevisionId, positionStableId } from '@/shared/types';
import type { Position } from '../../../domain';
import { PositionSchema } from '../../../domain';
import {
  FundingRate,
  PnlDelta,
  PositionFee,
  PositionSize,
  RealizedPnl,
} from '../../../domain/positions.decimals';

export function toDomainPosition(gql: GraphQLPosition): Position {
  return PositionSchema.parse({
    revisionId: positionRevisionId(gql.id),
    positionKey: {
      id: positionStableId(gql.positionKey.id),
      account: address(gql.positionKey.account),
      indexAssetId: assetId(gql.positionKey.indexAssetId),
      isLong: gql.positionKey.isLong,
    },
    collateralAmount: CollateralAmount.fromBigInt(BigInt(gql.collateralAmount)),
    size: PositionSize.fromBigInt(BigInt(gql.size)),
    timestamp: gql.timestamp,
    latest: gql.latest,
    change: gql.change,
    collateralTransferred: CollateralAmount.fromBigInt(BigInt(gql.collateralTransferred)),
    positionFee: PositionFee.fromBigInt(BigInt(gql.positionFee)),
    fundingRate: FundingRate.fromBigInt(BigInt(gql.fundingRate)),
    pnlDelta: PnlDelta.fromBigInt(BigInt(gql.pnlDelta)),
    realizedFundingRate: FundingRate.fromBigInt(BigInt(gql.realizedFundingRate)),
    realizedPnl: RealizedPnl.fromBigInt(BigInt(gql.realizedPnl)),
  });
}
