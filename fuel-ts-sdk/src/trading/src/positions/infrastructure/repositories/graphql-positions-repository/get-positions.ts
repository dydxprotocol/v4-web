import type { GraphQLClient } from 'graphql-request';
import type { Position as GraphQLPosition } from '@/generated/graphql';
import type { Address, AssetId } from '@/shared/types';
import { address, assetId, positionId } from '@/shared/types';
import type { GetPositionsOptions, Position } from '../../../domain';
import { PositionKeySchema, PositionSchema } from '../../../domain';
import { GET_POSITIONS_QUERY, GET_POSITION_KEYS_BY_ACCOUNT } from './get-positions.gql';

export const getPositions =
  (client: GraphQLClient) =>
  async (options: GetPositionsOptions = {}): Promise<Position[]> => {
    const { limit = 100, offset = 0, orderBy = 'TIMESTAMP_DESC', account } = options;

    // If filtering by account only, first get position key IDs for that account
    let positionKeyIds: string[] | undefined;
    if (account && !options.indexAssetId && options.isLong === undefined) {
      const keysData = await client.request<{ positionKeys: { nodes: { id: string }[] } }>(
        GET_POSITION_KEYS_BY_ACCOUNT,
        { account }
      );
      positionKeyIds = keysData.positionKeys.nodes.map((k) => k.id);

      // If no position keys found, return empty array
      if (positionKeyIds.length === 0) {
        return [];
      }
    }

    const where = buildWhereClause(options, positionKeyIds);

    const data = await client.request<{ positions: { nodes: GraphQLPosition[] } }>(
      GET_POSITIONS_QUERY,
      {
        limit,
        offset,
        where,
        orderBy: [orderBy],
      }
    );

    return data.positions.nodes.map(toDomainPosition);
  };

interface PositionWhereClause {
  positionKeyId?: { equalTo?: string; in?: string[] };
  latest?: { equalTo?: boolean };
}

function buildPositionKeyId(account: Address, indexAssetId: AssetId, isLong: boolean): string {
  // Position key format: account-indexAssetId-isLong
  return `${account}-${indexAssetId}-${isLong}`;
}

function buildWhereClause(options: GetPositionsOptions, positionKeyIds?: string[]) {
  const { account, indexAssetId, isLong, latestOnly } = options;

  const where: PositionWhereClause = {};

  // If we have position key IDs from the account query, filter by those
  if (positionKeyIds && positionKeyIds.length > 0) {
    where.positionKeyId = { in: positionKeyIds };
  }
  // Otherwise filter by full positionKeyId if we have all three components
  else if (account && indexAssetId && isLong !== undefined) {
    where.positionKeyId = { equalTo: buildPositionKeyId(account, indexAssetId, isLong) };
  }

  if (latestOnly) where.latest = { equalTo: true };

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
