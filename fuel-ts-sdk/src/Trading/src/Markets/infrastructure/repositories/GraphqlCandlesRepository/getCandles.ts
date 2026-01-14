import type { GraphQLClient } from 'graphql-request';
import type {
  CandleD1,
  CandleH1,
  CandleH4,
  CandleM1,
  CandleM5,
  CandleM15,
  CandleM30,
} from '@/generated/graphql';
import { assetId, candleId } from '@/shared/types';
import type { CandleInterval, GetCandlesOptions } from '../../../domain';
import { type Candle, CandleEntitySchema } from '../../../domain';
import {
  GET_CANDLES_D1_QUERY,
  GET_CANDLES_H1_QUERY,
  GET_CANDLES_H4_QUERY,
  GET_CANDLES_M1_QUERY,
  GET_CANDLES_M5_QUERY,
  GET_CANDLES_M15_QUERY,
  GET_CANDLES_M30_QUERY,
} from './getCandles.gql';

type GraphQLCandle = CandleD1 | CandleH1 | CandleH4 | CandleM1 | CandleM5 | CandleM15 | CandleM30;

// Map intervals to their corresponding queries
const intervalQueryMap: Record<CandleInterval, string> = {
  M1: GET_CANDLES_M1_QUERY,
  M5: GET_CANDLES_M5_QUERY,
  M15: GET_CANDLES_M15_QUERY,
  M30: GET_CANDLES_M30_QUERY,
  H1: GET_CANDLES_H1_QUERY,
  H4: GET_CANDLES_H4_QUERY,
  D1: GET_CANDLES_D1_QUERY,
};

// Map intervals to their corresponding GraphQL response field names
const intervalFieldMap: Record<CandleInterval, string> = {
  M1: 'candleM1s',
  M5: 'candleM5s',
  M15: 'candleM15s',
  M30: 'candleM30s',
  H1: 'candleH1s',
  H4: 'candleH4s',
  D1: 'candleD1s',
};

export const getCandles =
  (client: GraphQLClient) =>
  async (options: GetCandlesOptions): Promise<Candle[]> => {
    const { limit, offset = 0, orderBy = 'STARTED_AT_DESC', asset, interval } = options;

    const query = intervalQueryMap[interval];
    const fieldName = intervalFieldMap[interval];

    const where = asset ? { asset: { equalTo: asset } } : undefined;

    const data = await client.request<Record<string, { nodes: GraphQLCandle[] }>>(query, {
      limit,
      offset,
      where,
      orderBy: [orderBy],
    });

    const nodes = data[fieldName]?.nodes || [];
    return mapCandlesWithOpen(nodes, interval);
  };

function mapCandlesWithOpen(gqlCandles: GraphQLCandle[], interval: CandleInterval): Candle[] {
  // Since candles are ordered DESC by startedAt, we need to reverse to calculate opens
  const sorted = [...gqlCandles].reverse();

  return sorted.map((gql, index) => {
    const asset = assetId(gql.asset);
    const id = candleId(`${asset}-${interval}-${gql.startedAt}`);

    // Use previous candle's close as this candle's open
    // For the first candle, use its own close as open (will appear flat)
    const openPrice = index > 0 ? BigInt(sorted[index - 1].closePrice) : BigInt(gql.closePrice);

    return CandleEntitySchema.parse({
      id,
      asset,
      interval,
      openPrice,
      closePrice: BigInt(gql.closePrice),
      highPrice: BigInt(gql.highPrice),
      lowPrice: BigInt(gql.lowPrice),
      startedAt: gql.startedAt,
    });
  });
}
