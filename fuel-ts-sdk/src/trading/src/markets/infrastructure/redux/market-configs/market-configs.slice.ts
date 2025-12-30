import { createSlice } from '@reduxjs/toolkit';
import 'immer';
import { fetchMarketConfig } from './market-configs.thunks';
import { marketConfigsAdapter, marketConfigsInitialState } from './market-configs.types';

export const marketConfigsSlice = createSlice({
  name: 'marketConfigs',
  initialState: marketConfigsInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketConfig.pending, (state) => {
        state.fetchStatus = 'pending';
        state.error = null;
      })
      .addCase(fetchMarketConfig.fulfilled, (state, action) => {
        marketConfigsAdapter.upsertOne(state, action.payload);
        state.fetchStatus = 'fulfilled';
      })
      .addCase(fetchMarketConfig.rejected, (state, action) => {
        state.fetchStatus = 'rejected';
        state.error = action.payload ?? 'Failed to fetch market config';
      });
  },
});

export const { actions: marketConfigsActions, reducer: marketConfigsReducer } = marketConfigsSlice;
