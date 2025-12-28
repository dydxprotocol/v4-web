import type { GraphQLClient } from 'graphql-request';
import type { PositionRepository } from '../../domain';
import { getCurrentPositions } from './get-current-positions';
import { getPositions } from './get-positions';
import { getPositionsByAccount } from './get-positions-by-account';
import { getPositionsByAsset } from './get-positions-by-asset';

export const createGraphQLPositionRepository = (client: GraphQLClient): PositionRepository => ({
  getPositions: getPositions(client),
  getPositionsByAccount: getPositionsByAccount(client),
  getPositionsByAsset: getPositionsByAsset(client),
  getCurrentPositions: getCurrentPositions(client),
});
