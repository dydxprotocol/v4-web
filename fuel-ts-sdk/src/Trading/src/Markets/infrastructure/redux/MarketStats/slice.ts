import { createSlice } from '@reduxjs/toolkit';
import { asyncFetchMarketStatsByAssetIdThunk } from './thunks';
import { marketStatsEntityAdapter, nullMarketStatsState } from './types';

const marketStatsSlice = createSlice({
  name: 'markets/marketStats',
  initialState: nullMarketStatsState,
  reducers: {},
  extraReducers: (builder) =>
    builder.addAsyncThunk(asyncFetchMarketStatsByAssetIdThunk, {
      fulfilled: (state, action) => {
        if (action.payload) marketStatsEntityAdapter.upsertOne(state, action.payload);
        state.error = null;
        state.fetchStatus = 'fulfilled';
      },
      pending: (state) => {
        state.fetchStatus = 'pending';
        state.error = null;
      },
      rejected: (state, action) => {
        state.error = action.payload;
        state.fetchStatus = 'rejected';
      },
    }),
});

export const { actions: marketStatsActions, reducer: marketStatsReducer } = marketStatsSlice;
