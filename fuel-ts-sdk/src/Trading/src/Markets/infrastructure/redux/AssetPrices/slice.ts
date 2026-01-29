import { createSlice } from '@reduxjs/toolkit';
import 'immer';
import { asyncFetchCurrentAssetPricesThunk } from './thunks';
import { assetPricesAdapter, assetPricesInitialState } from './types';

export const assetPricesSlice = createSlice({
  name: 'assetPrices',
  initialState: assetPricesInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(asyncFetchCurrentAssetPricesThunk.fulfilled, (state, action) => {
        if (action.payload) assetPricesAdapter.upsertOne(state, action.payload);
        state.fetchStatus = 'fulfilled';
      })
      .addCase(asyncFetchCurrentAssetPricesThunk.rejected, (state, action) => {
        state.fetchStatus = 'rejected';
        state.error = action.payload ?? 'Failed to fetch current asset prices';
      });
  },
});

export const { actions: assetPricesActions, reducer: assetPricesReducer } = assetPricesSlice;
