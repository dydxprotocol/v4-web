import type { GraphQLClient } from 'graphql-request';
import type { PositionRepository } from '../../../domain';
import { getPositionsByAccount } from './getPositionsByAccount';
import { getPositionsByStableId } from './getPositionsByKeyId';

export const createGraphQLPositionRepository = (client: GraphQLClient): PositionRepository => ({
  getPositionsByStableId: getPositionsByStableId(client),
  getPositionsByAccount: getPositionsByAccount(client),
});
