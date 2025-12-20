import { Positions, Prices } from '@/trading';
import { GraphQLClient } from 'graphql-request';

export interface StarboardClient {
  positions: Positions.PositionRepository;
  prices: Prices.PriceRepository;
}

export interface StarboardClientConfig {
  indexerUrl: string;
}

export const createStarboardClient = (config: StarboardClientConfig): StarboardClient => {
  const graphqlClient = new GraphQLClient(config.indexerUrl);

  return {
    positions: Positions.createGraphQLPositionRepository(graphqlClient),
    prices: Prices.createGraphQLPriceRepository(graphqlClient),
  };
};
