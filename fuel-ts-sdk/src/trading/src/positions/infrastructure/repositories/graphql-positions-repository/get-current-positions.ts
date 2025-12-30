import type { GraphQLClient } from 'graphql-request';
import type { Address } from '@/shared/types';
import type { Position } from '../../../domain';
import { filterOpenPositions } from '../../../domain';
import { getPositionsByAccount } from './get-positions-by-account';

export const getCurrentPositions =
  (client: GraphQLClient) =>
  async (account: Address): Promise<Position[]> => {
    const positions = await getPositionsByAccount(client)(account, true);
    return filterOpenPositions(positions);
  };
