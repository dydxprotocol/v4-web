import type { GraphQLClient } from 'graphql-request';
import type { MarketConfigRepository } from '../../../domain';
import { getMarketConfig } from './get-market-config';

export const createGraphQLMarketConfigRepository = (
  client: GraphQLClient
): MarketConfigRepository => ({
  getMarketConfig: getMarketConfig(client),
});
