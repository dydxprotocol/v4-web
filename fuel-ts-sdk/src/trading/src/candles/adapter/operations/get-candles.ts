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
import { AssetId, assetId } from '@/shared/types';
import { type Candle, CandleSchema } from '../../domain';
import type { CandleInterval, GetCandlesOptions } from '../../port';
import {
  GET_CANDLES_D1_QUERY,
  GET_CANDLES_H1_QUERY,
  GET_CANDLES_H4_QUERY,
  GET_CANDLES_M1_QUERY,
  GET_CANDLES_M5_QUERY,
  GET_CANDLES_M15_QUERY,
  GET_CANDLES_M30_QUERY,
} from './get-candles.query';

type GraphQLCandle = CandleD1 | CandleH1 | CandleH4 | CandleM1 | CandleM5 | CandleM15 | CandleM30;

export const getCandles =
  (client: GraphQLClient) =>
  async (options: GetCandlesOptions): Promise<Candle[]> => {
    const { interval, limit = 100, offset = 0, orderBy = 'STARTED_AT_DESC' } = options;

    const where = buildWhereClause(options);
    const query = getQueryForInterval(interval);
    const queryField = getQueryFieldForInterval(interval);

    const data = await client.request<Record<string, { nodes: GraphQLCandle[] }>>(query, {
      limit,
      offset,
      where,
      orderBy: [orderBy],
    });

    const candles = data[queryField]?.nodes || [];
    return candles.map(toDomainCandle);
  };

function getQueryForInterval(interval: CandleInterval) {
  switch (interval) {
    case 'D1':
      return GET_CANDLES_D1_QUERY;
    case 'H1':
      return GET_CANDLES_H1_QUERY;
    case 'H4':
      return GET_CANDLES_H4_QUERY;
    case 'M1':
      return GET_CANDLES_M1_QUERY;
    case 'M5':
      return GET_CANDLES_M5_QUERY;
    case 'M15':
      return GET_CANDLES_M15_QUERY;
    case 'M30':
      return GET_CANDLES_M30_QUERY;
  }
}

function getQueryFieldForInterval(interval: CandleInterval): string {
  switch (interval) {
    case 'D1':
      return 'candleD1s';
    case 'H1':
      return 'candleH1s';
    case 'H4':
      return 'candleH4s';
    case 'M1':
      return 'candleM1s';
    case 'M5':
      return 'candleM5s';
    case 'M15':
      return 'candleM15s';
    case 'M30':
      return 'candleM30s';
  }
}

interface CandleWhereClause {
  asset_eq?: AssetId;
}

function buildWhereClause(options: GetCandlesOptions) {
  const { asset } = options;

  const where: CandleWhereClause = {};

  if (asset) {
    where.asset_eq = asset;
  }

  return Object.keys(where).length > 0 ? where : undefined;
}

function toDomainCandle(gql: GraphQLCandle): Candle {
  return CandleSchema.parse({
    asset: assetId(gql.asset),
    closePrice: BigInt(gql.closePrice),
    highPrice: BigInt(gql.highPrice),
    lowPrice: BigInt(gql.lowPrice),
    startedAt: gql.startedAt,
  });
}
