import { combineReducers } from '@reduxjs/toolkit';
import { positionsApi, positionsSliceReducer } from './Positions';

export type { PositionsThunkExtra } from './Positions';

export const positionsReducer = {
  trading: combineReducers({
    positions: positionsSliceReducer,
  }),
  [positionsApi.reducerPath]: positionsApi.reducer,
};

export const positionsMiddleware = [positionsApi.middleware];
