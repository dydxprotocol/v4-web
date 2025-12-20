import { createSlice } from '@reduxjs/toolkit';
import 'immer';

import * as oraclePricesReducers from './oracle-prices.actions';
import { fetchOraclePrice, fetchOraclePrices } from './oracle-prices.thunks';
import { oraclePricesInitialState } from './oracle-prices.types';

export const oraclePricesSlice = createSlice({
  name: 'oraclePrices',
  initialState: oraclePricesInitialState,
  reducers: oraclePricesReducers,
  extraReducers: (builder) => {
    builder
      .addCase(fetchOraclePrice.pending, (state) => {
        state.fetchStatus = 'pending';
        state.error = null;
      })
      .addCase(fetchOraclePrice.fulfilled, (state, action) => {
        state.data[action.payload.assetId] = action.payload.price;
        state.fetchStatus = 'fulfilled';
      })
      .addCase(fetchOraclePrice.rejected, (state, action) => {
        state.fetchStatus = 'rejected';
        state.error = action.payload ?? 'Failed to fetch oracle price';
      })
      .addCase(fetchOraclePrices.pending, (state) => {
        state.fetchStatus = 'pending';
        state.error = null;
      })
      .addCase(fetchOraclePrices.fulfilled, (state, action) => {
        action.payload.forEach(({ assetId, price }) => {
          state.data[assetId] = price;
        });
        state.fetchStatus = 'fulfilled';
      })
      .addCase(fetchOraclePrices.rejected, (state, action) => {
        state.fetchStatus = 'rejected';
        state.error = action.payload ?? 'Failed to fetch oracle prices';
      });
  },
});

export const { actions: oraclePricesActions, reducer: oraclePricesReducer } = oraclePricesSlice;
