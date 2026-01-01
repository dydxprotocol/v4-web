import type { GraphQLClient } from 'graphql-request';
import type { Position as GraphQLPosition } from '@/generated/graphql';
import type { PositionStableId } from '@/shared/types';
import type { Position } from '../../../domain';
import { GET_POSITIONS_BY_KEY_ID_QUERY } from './get-positions-by-key-id.gql';
import { toDomainPosition } from './mappers';

export const getPositionsByStableId =
  (client: GraphQLClient) =>
  async (stableId: PositionStableId, latestOnly = true): Promise<Position[]> => {
    const data = await client.request<{
      positions: { nodes: GraphQLPosition[] };
    }>(GET_POSITIONS_BY_KEY_ID_QUERY, {
      positionKeyId: stableId,
      latestOnly,
    });

    return data.positions.nodes.map(toDomainPosition);
  };
