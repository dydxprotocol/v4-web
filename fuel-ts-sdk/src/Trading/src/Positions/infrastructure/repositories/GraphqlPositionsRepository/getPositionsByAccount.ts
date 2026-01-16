import type { Address } from '@sdk/shared/types';
import type { GraphQLClient } from 'graphql-request';
import type { PositionEntity } from '../../../domain';
import { GET_POSITIONS_BY_ACCOUNT_QUERY } from './getPositionsByAccount.gql';
import { type NestedPositionKeyResponse, toDomainPosition } from './mappers';

export const getPositionsByAccount =
  (client: GraphQLClient) =>
  async (account?: Address, latestOnly = true): Promise<PositionEntity[]> => {
    const data = await client.request<{
      positionKeys: { nodes: NestedPositionKeyResponse[] };
    }>(GET_POSITIONS_BY_ACCOUNT_QUERY, {
      account,
      latestOnly,
    });

    return data.positionKeys.nodes.flatMap((positionKey) =>
      positionKey.positions.nodes.map((position) => toDomainPosition(position, positionKey))
    );
  };
