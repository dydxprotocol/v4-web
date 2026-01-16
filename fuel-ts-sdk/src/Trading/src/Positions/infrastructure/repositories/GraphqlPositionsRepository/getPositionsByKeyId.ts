import type { PositionStableId } from '@sdk/shared/types';
import type { GraphQLClient } from 'graphql-request';
import type { PositionEntity } from '../../../domain';
import { GET_POSITIONS_BY_KEY_ID_QUERY } from './getPositionsByKeyId.gql';
import { type NestedPositionKeyResponse, toDomainPosition } from './mappers';

export const getPositionsByStableId =
  (client: GraphQLClient) =>
  async (stableId: PositionStableId, latestOnly = true): Promise<PositionEntity[]> => {
    const data = await client.request<{
      positionKeys: { nodes: NestedPositionKeyResponse[] };
    }>(GET_POSITIONS_BY_KEY_ID_QUERY, {
      positionKeyId: stableId,
      latestOnly,
    });

    return data.positionKeys.nodes.flatMap((positionKey) =>
      positionKey.positions.nodes.map((position) => toDomainPosition(position, positionKey))
    );
  };
