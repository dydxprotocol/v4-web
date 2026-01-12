import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import type { PositionStableId } from '@/shared/types';
import type { Position } from '../../../domain';
import { positionsApi } from './positions.api';

export const positionsAdapter = createEntityAdapter<Position, PositionStableId>({
  selectId: (position) => position.positionKey.id,
  sortComparer: (a, b) => b.timestamp - a.timestamp,
});

export const positionsSlice = createSlice({
  name: 'positions',
  initialState: positionsAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(positionsApi.endpoints.getPositionsByAddress.matchFulfilled, (state, action) => {
        if (action.payload) positionsAdapter.upsertMany(state, action.payload);
      })
      .addMatcher(positionsApi.endpoints.getPositionsByStableId.matchFulfilled, (state, action) => {
        if (action.payload) positionsAdapter.upsertMany(state, action.payload);
      });
  },
});

export const positionsSliceReducer = positionsSlice.reducer;
