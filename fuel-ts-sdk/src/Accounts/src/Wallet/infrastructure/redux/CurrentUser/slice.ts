import { createSlice } from '@reduxjs/toolkit';
import { UserBalancesChangedEvent } from '@sdk/shared/events/UserBalancesChanged';
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
      .addMatcher(UserBalancesChangedEvent.match, (state) => {
        console.log('poof!');
        state.status = 'uninitialized';
      }),
});

export const { actions: currentUserActions, reducer } = currentUserSlice;
