import type { GraphQLClient } from 'graphql-request';
import type { Position as GraphQLPosition } from '@sdk/generated/graphql';
import type { PositionStableId } from '@sdk/shared/types';
import type { PositionEntity } from '../../../domain';
import { GET_POSITIONS_BY_KEY_ID_QUERY } from './getPositionsByKeyId.gql';
import { toDomainPosition } from './mappers';

export const getPositionsByStableId =
  (client: GraphQLClient) =>
  async (stableId: PositionStableId, latestOnly = true): Promise<PositionEntity[]> => {
    const data = await client.request<{
      positions: { nodes: GraphQLPosition[] };
    }>(GET_POSITIONS_BY_KEY_ID_QUERY, {
      positionKeyId: stableId,
      latestOnly,
    });

    return data.positions.nodes.map(toDomainPosition);
  };
