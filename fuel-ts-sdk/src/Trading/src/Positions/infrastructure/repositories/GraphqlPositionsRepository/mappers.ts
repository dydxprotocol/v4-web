import type { Position as GraphQLPosition } from '@sdk/generated/graphql';
import { address, assetId, positionRevisionId, positionStableId } from '@sdk/shared/types';
import type { PositionEntity } from '../../../domain';
import { PositionSchema } from '../../../domain';

export function toDomainPosition(gql: GraphQLPosition): PositionEntity {
  // Calculate positionFee as sum of liquidity fee, protocol fee, and liquidation fee
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
    collateralAmount: gql.collateral,
    size: gql.size,
    timestamp: gql.timestamp,
    latest: gql.latest,
    change: gql.change,
    collateralTransferred: gql.collateralDelta,
    positionFee: positionFee.toString(),
    fundingRate: gql.fundingRate,
    pnlDelta: gql.pnlDelta,
    realizedFundingRate: gql.realizedFundingRate,
    realizedPnl: gql.realizedPnl,
  });
}
