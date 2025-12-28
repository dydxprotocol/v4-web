import type { GraphQLClient } from 'graphql-request';
import { CandleRepository } from '../../domain';
import { getCandles } from './operations/get-candles';

export const createGraphQLCandleRepository = (client: GraphQLClient): CandleRepository => ({
  getCandles: getCandles(client),
});
