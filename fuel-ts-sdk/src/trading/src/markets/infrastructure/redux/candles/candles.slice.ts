import { createSlice } from '@reduxjs/toolkit';
import 'immer';
import { fetchCandles } from './candles.thunks';
import { candlesAdapter, candlesInitialState } from './candles.types';

export const candlesSlice = createSlice({
  name: 'candles',
  initialState: candlesInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandles.pending, (state) => {
        state.fetchStatus = 'pending';
        state.error = null;
      })
      .addCase(fetchCandles.fulfilled, (state, action) => {
        candlesAdapter.upsertMany(state, action.payload.candles);
        state.fetchStatus = 'fulfilled';
      })
      .addCase(fetchCandles.rejected, (state, action) => {
        state.fetchStatus = 'rejected';
        state.error = action.payload ?? 'Failed to fetch candles';
      });
  },
});

export const { actions: candlesActions, reducer: candlesReducer } = candlesSlice;
