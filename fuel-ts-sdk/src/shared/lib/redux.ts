import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { tradingReducer, type TradingThunkExtras } from '@/trading/di';

export type RequestStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected';

/**
 * Loadable - Wraps data with loading state
 * Use this for individual entities that can be loaded independently
 */
export interface LoadableMixin {
  fetchStatus: RequestStatus;
  error: string | null;
}
export interface Loadable<T> {
  data: T;
  fetchStatus: RequestStatus;
  error: string | null;
}

/**
 * LoadableState - State container with loading state
 * Use this for entire slices where all data loads together
 */
export interface LoadableState<T> {
  data: T;
  fetchStatus: RequestStatus;
  error: string | null;
}

export type StoreThunkExtraArgument = TradingThunkExtras;

export const createStore = (extraArgument: StoreThunkExtraArgument) => {
  return configureStore({
    reducer: combineReducers({
      trading: tradingReducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument,
        },
      }),
  });
};

export type RootStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<RootStore['getState']>;
export type AppDispatch = RootStore['dispatch'];
