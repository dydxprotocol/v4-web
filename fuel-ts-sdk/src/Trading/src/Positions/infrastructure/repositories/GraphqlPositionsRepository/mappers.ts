import type { Position as GraphQLPosition } from '@sdk/generated/graphql';
import { address, assetId, positionRevisionId, positionStableId } from '@sdk/shared/types';
import type { PositionEntity } from '../../../domain';
import { PositionSchema } from '../../../domain';

export function toDomainPosition(gql: GraphQLPosition): PositionEntity {
  return PositionSchema.parse({
    revisionId: positionRevisionId(gql.id),
    positionKey: {
      id: positionStableId(gql.positionKey.id),
      account: address(gql.positionKey.account),
      indexAssetId: assetId(gql.positionKey.indexAssetId),
      isLong: gql.positionKey.isLong,
    },
    collateralAmount: BigInt(gql.collateralAmount),
    size: BigInt(gql.size),
    timestamp: gql.timestamp,
    latest: gql.latest,
    change: gql.change,
    collateralTransferred: BigInt(gql.collateralTransferred),
    positionFee: BigInt(gql.positionFee),
    fundingRate: BigInt(gql.fundingRate),
    pnlDelta: BigInt(gql.pnlDelta),
    realizedFundingRate: BigInt(gql.realizedFundingRate),
    realizedPnl: BigInt(gql.realizedPnl),
  });
}
