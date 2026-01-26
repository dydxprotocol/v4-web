import { combineReducers } from '@reduxjs/toolkit';
import { positionsApi, positionsSliceReducer } from './Positions';

export type { PositionsThunkExtra } from './Positions';

export const positionsReducer = combineReducers({
  positions: positionsSliceReducer,
});

export const positionsApis = {
  positionsApi: positionsApi.reducer,
};

export const positionsMiddleware = [positionsApi.middleware];
