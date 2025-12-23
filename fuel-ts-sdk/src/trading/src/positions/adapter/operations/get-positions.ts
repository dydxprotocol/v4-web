import type { Position as GraphQLPosition } from '@/generated/graphql';
import { Address, address, AssetId, assetId, positionId } from '@/shared/types';
import type { GraphQLClient } from 'graphql-request';

import { PositionKeySchema, PositionSchema, type Position } from '../../domain';
import type { GetPositionsOptions } from '../../port';
import { GET_POSITIONS_QUERY } from './get-positions.query';

export const getPositions =
  (client: GraphQLClient) =>
  async (options: GetPositionsOptions = {}): Promise<Position[]> => {
    const { limit = 100, offset = 0, orderBy = 'timestamp_DESC' } = options;

    const where = buildWhereClause(options);

    const data = await client.request<{ positions: GraphQLPosition[] }>(GET_POSITIONS_QUERY, {
      limit,
      offset,
      where,
      orderBy: [orderBy],
    });

    return data.positions.map(toDomainPosition);
  };

interface PositionWhereClause {
  positionKey?: {
    account_eq?: Address;
    indexAssetId_eq?: AssetId;
    isLong_eq?: boolean;
  };
  latest_eq?: boolean;
}

function buildWhereClause(options: GetPositionsOptions) {
  const { account, indexAssetId, isLong, latestOnly } = options;

  const where: PositionWhereClause = {};

  if (account || indexAssetId || isLong !== undefined) {
    where.positionKey = {};
    if (account) where.positionKey.account_eq = account;
    if (indexAssetId) where.positionKey.indexAssetId_eq = indexAssetId;
    if (isLong !== undefined) where.positionKey.isLong_eq = isLong;
  }

  if (latestOnly) where.latest_eq = true;

  return Object.keys(where).length > 0 ? where : undefined;
}

function toDomainPosition(gql: GraphQLPosition): Position {
  return PositionSchema.parse({
    id: positionId(gql.id),
    positionKey: PositionKeySchema.parse({
      account: address(gql.positionKey.account),
      indexAssetId: assetId(gql.positionKey.indexAssetId),
      isLong: gql.positionKey.isLong,
    }),
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
