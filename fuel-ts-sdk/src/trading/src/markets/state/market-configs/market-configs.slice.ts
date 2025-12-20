import { createSlice } from '@reduxjs/toolkit';
import 'immer';

import * as marketConfigsReducers from './market-configs.actions';
import { fetchMarketConfig } from './market-configs.thunks';
import { marketConfigsInitialState } from './market-configs.types';

export const marketConfigsSlice = createSlice({
  name: 'marketConfigs',
  initialState: marketConfigsInitialState,
  reducers: marketConfigsReducers,
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketConfig.pending, (state) => {
        state.fetchStatus = 'pending';
        state.error = null;
      })
      .addCase(fetchMarketConfig.fulfilled, (state, action) => {
        state.data[action.payload.assetId] = action.payload.config;
        state.fetchStatus = 'fulfilled';
      })
      .addCase(fetchMarketConfig.rejected, (state, action) => {
        state.fetchStatus = 'rejected';
        state.error = action.payload ?? 'Failed to fetch market config';
      });
  },
});

export const { actions: marketConfigsActions, reducer: marketConfigsReducer } = marketConfigsSlice;
