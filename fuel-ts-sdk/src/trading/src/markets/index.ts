import { StoreService } from '@/shared/lib/store-service';
import { GraphQLClient } from 'graphql-request';

import { createGraphQLMarketRepository } from './adapter';
import { createMarketDataService } from './services/market-data.service';

export { MarketConfigSchema, OraclePriceSchema } from './domain';
export type { OraclePriceData } from './domain';
export type { MarketConfig } from './port';
export type { MarketDataService } from './services/market-data.service';

export { marketsReducer, type MarketsThunkExtra } from './state/markets.reducer';

export function createRepositories(graphqlClient: GraphQLClient) {
  return {
    graphQLMarketRepository: createGraphQLMarketRepository(graphqlClient),
  };
}

export function createServices(storeService: StoreService) {
  return {
    marketDataService: createMarketDataService(storeService),
  };
}
