import { createSlice } from '@reduxjs/toolkit';
import {
  BaseTokenFauceted,
  LiquidityAddedEvent,
  LiquidityRemovedEvent,
  PositionDecreasedEvent,
  PositionIncreasedEvent,
} from '@sdk/shared/contracts';
import { asyncFetchCurrentUserBalancesThunk } from './thunks';
import { nullCurrentUserState } from './types';

const currentUserSlice = createSlice({
  name: 'currentUser',
  initialState: nullCurrentUserState,
  reducers: {
    invalidateCurrentUserDataFetch(state) {
      state.status = 'uninitialized';
    },
  },
  extraReducers: (builder) =>
    builder
      .addAsyncThunk(asyncFetchCurrentUserBalancesThunk, {
        fulfilled: (state, action) => {
          state.error = null;
          state.data = action.payload;
          state.status = 'fulfilled';
        },
        rejected: (state, action) => {
          state.data = null;
          state.error = action.payload ?? 'An unknown error occurred';
          state.status = 'rejected';
        },
        pending: (state) => {
          state.status = 'pending';
        },
      })
      .addMatcher(PositionIncreasedEvent.match, (state) => {
        state.status = 'uninitialized';
      })
      .addMatcher(LiquidityAddedEvent.match, (state) => {
        state.status = 'uninitialized';
      })
      .addMatcher(LiquidityRemovedEvent.match, (state) => {
        state.status = 'uninitialized';
      })
      .addMatcher(PositionDecreasedEvent.match, (state) => {
        state.status = 'uninitialized';
      })
      .addMatcher(BaseTokenFauceted.match, (state) => {
        state.status = 'uninitialized';
      }),
});

export const { actions: currentUserActions, reducer } = currentUserSlice;
