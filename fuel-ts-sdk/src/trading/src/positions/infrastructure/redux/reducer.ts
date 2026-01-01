import { combineReducers } from '@reduxjs/toolkit';
import { positionsApi, positionsSliceReducer } from './positions';

export type { PositionsThunkExtra } from './positions';

export const positionsReducer = {
  trading: combineReducers({
    positions: positionsSliceReducer,
  }),
  [positionsApi.reducerPath]: positionsApi.reducer,
};

export const positionsMiddleware = [positionsApi.middleware];
