import type { GraphQLClient } from 'graphql-request';
import type { CurrentPriceRepository } from '../port';
import { getCurrentPrices } from './operations/get-current-prices';

export const createGraphQLCurrentPriceRepository = (
  client: GraphQLClient
): CurrentPriceRepository => ({
  getCurrentPrices: getCurrentPrices(client),
});
