import { tradingReducer, type TradingThunkExtras } from '@/trading';
import { combineReducers, configureStore } from '@reduxjs/toolkit';

export type RequestStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected';

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
