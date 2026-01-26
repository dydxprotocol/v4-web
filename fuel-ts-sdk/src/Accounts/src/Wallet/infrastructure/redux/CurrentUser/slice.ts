import { createSlice } from '@reduxjs/toolkit';
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
    builder.addAsyncThunk(asyncFetchCurrentUserBalancesThunk, {
      fulfilled: (state, action) => {
        state.error = null;
        state.data = action.payload;
        state.status = 'fulfilled';
      },
      rejected: (state, action) => {
        state.data = null;
        state.error = action.error.message;
        state.status = 'rejected';
      },
      pending: (state) => {
        state.status = 'pending';
      },
    }),
});

export const { actions: currentUserActions, reducer } = currentUserSlice;
