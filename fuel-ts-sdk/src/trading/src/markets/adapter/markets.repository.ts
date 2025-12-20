import type { GraphQLClient } from 'graphql-request';

import type { MarketRepository } from '../port';
import { getMarketConfig } from './operations/get-market-config';
import { getOraclePrice } from './operations/get-oracle-price';
import { getOraclePrices } from './operations/get-oracle-prices';

export const createGraphQLMarketRepository = (client: GraphQLClient): MarketRepository => ({
  getMarketConfig: getMarketConfig(client),
  getOraclePrice: getOraclePrice(client),
  getOraclePrices: getOraclePrices(client),
});
