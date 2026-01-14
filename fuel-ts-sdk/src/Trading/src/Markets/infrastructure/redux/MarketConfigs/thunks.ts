import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AssetId } from '@/shared/types';
import type { MarketConfigEntity, MarketConfigRepository } from '../../../domain';

export const fetchMarketConfig = createAsyncThunk<
  MarketConfigEntity,
  AssetId,
  { rejectValue: string; extra: MarketsConfigThunkExtra }
>('markets/fetchMarketConfig', async (assetId, { rejectWithValue, extra }) => {
  try {
    const config = await extra.marketConfigRepository.getMarketConfig(assetId);
    return config;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export interface MarketsConfigThunkExtra {
  marketConfigRepository: MarketConfigRepository;
}
