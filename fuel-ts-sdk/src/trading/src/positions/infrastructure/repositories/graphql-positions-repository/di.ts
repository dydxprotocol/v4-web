import type { GraphQLClient } from 'graphql-request';
import type { PositionRepository } from '../../../domain';
import { getPositionsByAccount } from './get-positions-by-account';
import { getPositionsByStableId } from './get-positions-by-key-id';

export const createGraphQLPositionRepository = (client: GraphQLClient): PositionRepository => ({
  getPositionsByStableId: getPositionsByStableId(client),
  getPositionsByAccount: getPositionsByAccount(client),
});
