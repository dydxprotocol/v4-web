import type { GraphQLClient } from 'graphql-request';
import type { CandleRepository } from '../../../domain';
import { getCandles } from './getCandles';

export const createGraphQLCandleRepository = (client: GraphQLClient): CandleRepository => ({
  getCandles: getCandles(client),
});
