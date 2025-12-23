import { Candles, CurrentPrices, Positions, Prices } from '@/trading';
import { GraphQLClient } from 'graphql-request';

export interface StarboardClient {
  positions: Positions.PositionRepository;
  prices: Prices.PriceRepository;
  candles: Candles.CandleRepository;
  currentPrices: CurrentPrices.CurrentPriceRepository;
}

export interface StarboardClientConfig {
  indexerUrl: string;
}

export const createStarboardClient = (config: StarboardClientConfig): StarboardClient => {
  const graphqlClient = new GraphQLClient(config.indexerUrl);

  return {
    positions: Positions.createGraphQLPositionRepository(graphqlClient),
    prices: Prices.createGraphQLPriceRepository(graphqlClient),
    candles: Candles.createGraphQLCandleRepository(graphqlClient),
    currentPrices: CurrentPrices.createGraphQLCurrentPriceRepository(graphqlClient),
  };
};
