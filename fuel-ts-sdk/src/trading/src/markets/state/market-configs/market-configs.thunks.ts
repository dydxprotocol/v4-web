import type { AssetId } from '@/shared/types';
import { createAsyncThunk } from '@reduxjs/toolkit';

import type { MarketConfig } from '../../domain';
import type { MarketRepository } from '../../port';

export const fetchMarketConfig = createAsyncThunk<
  { assetId: AssetId; config: MarketConfig },
  AssetId,
  { rejectValue: string; extra: MarketsConfigThunkExtra }
>('markets/fetchMarketConfig', async (assetId, { rejectWithValue, extra }) => {
  try {
    const config = await extra.marketRepository.getMarketConfig(assetId);
    return { assetId, config };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export interface MarketsConfigThunkExtra {
  marketRepository: MarketRepository;
}
