import type { GraphQLClient } from 'graphql-request';
import type { Position as GraphQLPosition } from '@/generated/graphql';
import type { Address } from '@/shared/types';
import type { Position } from '../../../domain';
import {
  GET_POSITIONS_BY_KEY_IDS_QUERY,
  GET_POSITION_KEYS_BY_ACCOUNT_QUERY,
} from './get-positions-by-account.gql';
import { toDomainPosition } from './mappers';

export const getPositionsByAccount =
  (client: GraphQLClient) =>
  async (account: Address, latestOnly = true): Promise<Position[]> => {
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
