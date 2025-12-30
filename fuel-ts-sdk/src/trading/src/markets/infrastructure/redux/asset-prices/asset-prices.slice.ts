import { createSlice } from '@reduxjs/toolkit';
import 'immer';
import {
  fetchAssetPricesByIds,
  fetchCurrentAssetPrices,
  fetchHistoricalAssetPrices,
} from './asset-prices.thunks';
import { assetPricesAdapter, assetPricesInitialState } from './asset-prices.types';

export const assetPricesSlice = createSlice({
  name: 'assetPrices',
  initialState: assetPricesInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssetPricesByIds.pending, (state) => {
        state.fetchStatus = 'pending';
        state.error = null;
      })
      .addCase(fetchAssetPricesByIds.fulfilled, (state, action) => {
        assetPricesAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchAssetPricesByIds.rejected, (state, action) => {
        state.fetchStatus = 'rejected';
        state.error = action.payload ?? 'Failed to fetch asset prices by IDs';
      })

      .addCase(fetchCurrentAssetPrices.pending, (state) => {
        state.fetchStatus = 'pending';
        state.error = null;
      })
      .addCase(fetchCurrentAssetPrices.fulfilled, (state, action) => {
        assetPricesAdapter.upsertMany(state, action.payload);
        state.fetchStatus = 'fulfilled';
      })
      .addCase(fetchCurrentAssetPrices.rejected, (state, action) => {
        state.fetchStatus = 'rejected';
        state.error = action.payload ?? 'Failed to fetch current asset prices';
      })

      .addCase(fetchHistoricalAssetPrices.pending, (state) => {
        state.fetchStatus = 'pending';
        state.error = null;
      })
      .addCase(fetchHistoricalAssetPrices.fulfilled, (state, action) => {
        assetPricesAdapter.upsertMany(state, action.payload);
        state.fetchStatus = 'fulfilled';
      })
      .addCase(fetchHistoricalAssetPrices.rejected, (state, action) => {
        state.fetchStatus = 'rejected';
        state.error = action.payload ?? 'Failed to fetch historical asset prices';
      });
  },
});

export const { actions: assetPricesActions, reducer: assetPricesReducer } = assetPricesSlice;
