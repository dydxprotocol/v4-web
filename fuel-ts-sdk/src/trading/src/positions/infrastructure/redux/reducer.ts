import { positionsApi } from './positions';

export type { PositionsThunkExtra } from './positions';

export const positionsReducer = {
  [positionsApi.reducerPath]: positionsApi.reducer,
};

export const positionsMiddleware = [positionsApi.middleware];
