import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import type { PositionRevisionId } from '@sdk/shared/types';
import type { PositionEntity } from '../../../domain';
import { positionsApi } from './api';

export const positionsAdapter = createEntityAdapter<PositionEntity, PositionRevisionId>({
  selectId: (position) => position.revisionId,
  sortComparer: (a, b) => b.timestamp - a.timestamp,
});

export const positionsSlice = createSlice({
  name: 'positions',
  initialState: positionsAdapter.getInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      positionsApi.endpoints.getPositionsByAddress.matchFulfilled,
      (state, action) => {
        if (action.payload) positionsAdapter.upsertMany(state, action.payload);
      }
    );
  },
});

export const positionsSliceReducer = positionsSlice.reducer;
