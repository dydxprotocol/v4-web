import type { GraphQLClient } from 'graphql-request';
import type { CandleRepository } from '../port';
import { getCandles } from './operations/get-candles';

export const createGraphQLCandleRepository = (client: GraphQLClient): CandleRepository => ({
  getCandles: getCandles(client),
});
