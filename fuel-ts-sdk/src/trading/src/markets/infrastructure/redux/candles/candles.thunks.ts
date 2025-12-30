import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AssetId } from '@/shared/types';
import type { Candle, CandleInterval, CandleRepository } from '../../../domain';

export const fetchCandles = createAsyncThunk<
  { asset: AssetId; interval: CandleInterval; candles: Candle[] },
  { asset: AssetId; interval: CandleInterval; limit?: number },
  { rejectValue: string; extra: CandlesThunkExtra }
>('markets/candles/fetch', async ({ asset, interval, limit = 100 }, { rejectWithValue, extra }) => {
  try {
    const candles = await extra.candleRepository.getCandles({ asset, interval, limit });
    return { asset, interval, candles };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export interface CandlesThunkExtra {
  candleRepository: CandleRepository;
}
