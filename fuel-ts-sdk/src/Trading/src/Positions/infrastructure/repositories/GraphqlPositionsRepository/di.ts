import type { GraphQLClient } from 'graphql-request';
import type { PositionRepository } from '../../../domain';
import { createGetPositionsByAccountAction } from './getPositionsByAccount';

export const createGraphQLPositionRepository = (client: GraphQLClient): PositionRepository => ({
  getPositionsByAccount: createGetPositionsByAccountAction(client),
});
