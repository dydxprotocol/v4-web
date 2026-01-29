import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AssetId } from '@sdk/shared/types';
import type { AssetPriceEntity, AssetPriceRepository } from '../../../domain';

export interface AssetPricesThunkExtra {
  assetPriceRepository: AssetPriceRepository;
}

export const asyncFetchCurrentAssetPricesThunk = createAsyncThunk<
  AssetPriceEntity | undefined,
  AssetId,
  { rejectValue: string; extra: AssetPricesThunkExtra }
>('markets/assetPrices/fetchCurrent', async (assetId, { rejectWithValue, extra }) => {
  try {
    return await extra.assetPriceRepository.getCurrentAssetPrice(assetId);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});
