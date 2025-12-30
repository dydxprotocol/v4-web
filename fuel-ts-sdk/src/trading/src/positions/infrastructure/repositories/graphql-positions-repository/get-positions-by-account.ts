import type { GraphQLClient } from 'graphql-request';
import type { Address } from '@/shared/types';
import type { Position } from '../../../domain';
import { getPositions } from './get-positions';

export const getPositionsByAccount =
  (client: GraphQLClient) =>
  async (account: Address, latestOnly = true): Promise<Position[]> => {
    return getPositions(client)({ account, latestOnly });
  };
