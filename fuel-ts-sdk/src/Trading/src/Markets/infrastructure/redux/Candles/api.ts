import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query';
import type { AssetId } from '@sdk/shared/types';
import type { Candle, CandleInterval, CandleRepository } from '../../../domain';

export interface GetCandlesArgs {
  asset: AssetId;
  interval: CandleInterval;
  limit?: number;
}

export const candlesApi = createApi({
  reducerPath: 'candlesApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Candles'],
  endpoints: (builder) => ({
    getCandles: builder.query<Candle[], GetCandlesArgs>({
      async queryFn(args, api) {
        try {
          const { candleRepository } = api.extra as CandlesThunkExtra;

          const candles = await candleRepository.getCandles({
            asset: args.asset,
            interval: args.interval,
            limit: args.limit,
          });

          return { data: candles };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      },
      providesTags: (_result, _error, args) => [
        { type: 'Candles', id: `${args.asset}-${args.interval}` },
      ],
    }),
  }),
});

export type CandlesThunkExtra = { candleRepository: CandleRepository };
