import type { GraphQLClient } from 'graphql-request';
import type { MarketConfigRepository } from '../../../domain';
import { getMarketConfig } from './getMarketConfig';

export const createGraphQLMarketConfigRepository = (
  client: GraphQLClient
): MarketConfigRepository => ({
  getMarketConfig: getMarketConfig(client),
});
