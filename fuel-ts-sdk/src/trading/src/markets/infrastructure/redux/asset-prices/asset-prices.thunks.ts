import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AssetId } from '@/shared/types';
import type { AssetPrice, AssetPriceRepository, GetAssetPricesOptions } from '../../../domain';

export interface AssetPricesThunkExtra {
  assetPriceRepository: AssetPriceRepository;
}

/**
 * Fetch asset prices by IDs (batch oracle query)
 */
export const fetchAssetPricesByIds = createAsyncThunk<
  AssetPrice[],
  AssetId[],
  { rejectValue: string; extra: AssetPricesThunkExtra }
>('markets/assetPrices/fetchByIds', async (assetIds, { rejectWithValue, extra }) => {
  try {
    return await extra.assetPriceRepository.getAssetPricesByIds(assetIds);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

/**
 * Fetch current asset prices
 */
export const fetchCurrentAssetPrices = createAsyncThunk<
  AssetPrice | undefined,
  AssetId,
  { rejectValue: string; extra: AssetPricesThunkExtra }
>('markets/assetPrices/fetchCurrent', async (assetId, { rejectWithValue, extra }) => {
  try {
    return await extra.assetPriceRepository.getCurrentAssetPrice(assetId);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

/**
 * Fetch historical asset prices
 */
export const fetchHistoricalAssetPrices = createAsyncThunk<
  AssetPrice[],
  GetAssetPricesOptions | undefined,
  { rejectValue: string; extra: AssetPricesThunkExtra }
>('markets/assetPrices/fetchHistorical', async (options, { rejectWithValue, extra }) => {
  try {
    return await extra.assetPriceRepository.getHistoricalAssetPrices(options);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});
