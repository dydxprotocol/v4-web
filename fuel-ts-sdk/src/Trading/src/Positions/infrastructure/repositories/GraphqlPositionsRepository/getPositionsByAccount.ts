import type { GraphQLClient } from 'graphql-request';
import type { Position as GraphQLPosition } from '@sdk/generated/graphql';
import type { Address } from '@sdk/shared/types';
import type { PositionEntity } from '../../../domain';
import {
  GET_POSITIONS_BY_KEY_IDS_QUERY,
  GET_POSITION_KEYS_BY_ACCOUNT_QUERY,
} from './getPositionsByAccount.gql';
import { toDomainPosition } from './mappers';

export const getPositionsByAccount =
  (client: GraphQLClient) =>
  async (account?: Address, latestOnly = true): Promise<PositionEntity[]> => {
    const keysData = await client.request<{
      positionKeys: { nodes: Array<{ id: string }> };
    }>(GET_POSITION_KEYS_BY_ACCOUNT_QUERY, {
      account,
    });

    const positionKeyIds = keysData.positionKeys.nodes.map((node) => node.id);

    if (positionKeyIds.length === 0) {
      return [];
    }

    const data = await client.request<{
      positions: { nodes: GraphQLPosition[] };
    }>(GET_POSITIONS_BY_KEY_IDS_QUERY, {
      positionKeyIds,
      latestOnly,
    });

    return data.positions.nodes.map(toDomainPosition);
  };
