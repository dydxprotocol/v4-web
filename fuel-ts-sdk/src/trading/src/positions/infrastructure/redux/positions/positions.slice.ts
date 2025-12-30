import { createSlice } from '@reduxjs/toolkit';
import 'immer';
import { fetchCurrentPositions, fetchPositionsByAccount } from './positions.thunks';
import { positionsAdapter, positionsInitialState } from './positions.types';

export const positionsSlice = createSlice({
  name: 'positions',
  initialState: positionsInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPositionsByAccount.pending, (state) => {
        state.fetchStatus = 'pending';
        state.error = null;
      })
      .addCase(fetchPositionsByAccount.fulfilled, (state, action) => {
        positionsAdapter.upsertMany(state, action.payload.positions);
        state.fetchStatus = 'fulfilled';
      })
      .addCase(fetchPositionsByAccount.rejected, (state, action) => {
        state.fetchStatus = 'rejected';
        state.error = action.payload ?? 'Failed to fetch positions';
      })
      .addCase(fetchCurrentPositions.pending, (state) => {
        state.fetchStatus = 'pending';
        state.error = null;
      })
      .addCase(fetchCurrentPositions.fulfilled, (state, action) => {
        positionsAdapter.upsertMany(state, action.payload.positions);
        state.fetchStatus = 'fulfilled';
      })
      .addCase(fetchCurrentPositions.rejected, (state, action) => {
        state.fetchStatus = 'rejected';
        state.error = action.payload ?? 'Failed to fetch current positions';
      });
  },
});

export const { actions: positionsActions, reducer: positionsReducer } = positionsSlice;
