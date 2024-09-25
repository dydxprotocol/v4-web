import { Middleware, combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import abacusStateManager from '@/lib/abacus';

import { accountSlice } from './account';
import { appSlice } from './app';
import appMiddleware from './appMiddleware';
import { assetsSlice } from './assets';
import { configsSlice } from './configs';
import { dialogsSlice } from './dialogs';
import { inputsSlice } from './inputs';
import { launchableMarketsSlice } from './launchableMarkets';
import { layoutSlice } from './layout';
import { localOrdersSlice } from './localOrders';
import { localizationSlice } from './localization';
import localizationMiddleware from './localizationMiddleware';
import { customCreateMigrate } from './migrations';
import { notificationsSlice } from './notifications';
import { perpetualsSlice } from './perpetuals';
import { tradingViewSlice } from './tradingView';
import { vaultsSlice } from './vaults';

const reducers = {
  account: accountSlice.reducer,
  app: appSlice.reducer,
  assets: assetsSlice.reducer,
  configs: configsSlice.reducer,
  dialogs: dialogsSlice.reducer,
  inputs: inputsSlice.reducer,
  launchableMarkets: launchableMarketsSlice.reducer,
  layout: layoutSlice.reducer,
  localization: localizationSlice.reducer,
  localOrders: localOrdersSlice.reducer,
  notifications: notificationsSlice.reducer,
  perpetuals: perpetualsSlice.reducer,
  tradingView: tradingViewSlice.reducer,
  vaults: vaultsSlice.reducer,
} as const;

const rootReducer = combineReducers(reducers);

const persistConfig = {
  key: 'root',
  version: 0,
  storage,
  whitelist: ['tradingView'],
  migrate: customCreateMigrate({ debug: process.env.NODE_ENV !== 'production' }),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(appMiddleware as Middleware, localizationMiddleware as Middleware),

  devTools: process.env.NODE_ENV !== 'production',
});

persistStore(store);

// Set store so (Abacus & v4-Client) classes can getState and dispatch
abacusStateManager.setStore(store);

export type RootStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = RootStore['dispatch'];
