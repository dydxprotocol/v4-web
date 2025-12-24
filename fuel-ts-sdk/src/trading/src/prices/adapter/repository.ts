import type { GraphQLClient } from 'graphql-request';
import type { PriceRepository } from '../port';
import { getPrices } from './operations/get-prices';

export const createGraphQLPriceRepository = (client: GraphQLClient): PriceRepository => ({
  getPrices: getPrices(client),
});
