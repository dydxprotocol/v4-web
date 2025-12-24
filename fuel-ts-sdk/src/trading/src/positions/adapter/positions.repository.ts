import type { GraphQLClient } from 'graphql-request';
import type { PositionRepository } from '../port';
import { getCurrentPositions } from './operations/get-current-positions';
import { getPositions } from './operations/get-positions';
import { getPositionsByAccount } from './operations/get-positions-by-account';
import { getPositionsByAsset } from './operations/get-positions-by-asset';

export const createGraphQLPositionRepository = (client: GraphQLClient): PositionRepository => ({
  getPositions: getPositions(client),
  getPositionsByAccount: getPositionsByAccount(client),
  getPositionsByAsset: getPositionsByAsset(client),
  getCurrentPositions: getCurrentPositions(client),
});
