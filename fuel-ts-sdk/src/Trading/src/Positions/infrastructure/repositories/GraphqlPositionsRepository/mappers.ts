import type { Position as GraphQLPosition } from '@/generated/graphql';
import { address, assetId, positionRevisionId, positionStableId } from '@/shared/types';
import type { PositionEntity } from '../../../domain';
import { PositionSchema } from '../../../domain';

export function toDomainPosition(gql: GraphQLPosition): PositionEntity {
  // Calculate positionFee as sum of liquidity fee, protocol fee, and liquidation fee (if applicable)
  const positionFee =
    BigInt(gql.outLiquidityFee) + BigInt(gql.outProtocolFee) + BigInt(gql.outLiquidationFee);

  return PositionSchema.parse({
    revisionId: positionRevisionId(gql.id),
    positionKey: {
      id: positionStableId(gql.positionKey.id),
      account: address(gql.positionKey.account),
      indexAssetId: assetId(gql.positionKey.indexAssetId),
      isLong: gql.positionKey.isLong,
    },
    collateralAmount: BigInt(gql.collateral),
    size: BigInt(gql.size),
    timestamp: gql.timestamp,
    latest: gql.latest,
    change: gql.change,
    collateralTransferred: BigInt(gql.collateralDelta),
    positionFee: positionFee,
    fundingRate: BigInt(gql.fundingRate),
    pnlDelta: BigInt(gql.pnlDelta),
    realizedFundingRate: BigInt(gql.realizedFundingRate),
    realizedPnl: BigInt(gql.realizedPnl),
  });
}
