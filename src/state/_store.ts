// eslint-disable-next-line no-restricted-imports
import { storeLifecycles } from '@/bonsai/storeLifecycles';
import { Middleware, combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import storage from 'redux-persist/lib/storage';

import abacusStateManager from '@/lib/abacus';
import { runFn } from '@/lib/do';
import { localWalletManager } from '@/lib/hdKeyManager';

import { accountSlice } from './account';
import { accountUiMemorySlice } from './accountUiMemory';
import { affiliatesSlice } from './affiliates';
import { appSlice } from './app';
import appMiddleware from './appMiddleware';
import { appUiConfigsSlice } from './appUiConfigs';
import { dialogsSlice } from './dialogs';
import { dismissableSlice } from './dismissable';
import { funkitDepositsSlice } from './funkitDeposits';
import { inputsSlice } from './inputs';
import { layoutSlice } from './layout';
import { localOrdersSlice } from './localOrders';
import { localizationSlice } from './localization';
import localizationMiddleware from './localizationMiddleware';
import { customCreateMigrate } from './migrations';
import { notificationsSlice } from './notifications';
import { perpetualsSlice } from './perpetuals';
import { rawSlice } from './raw';
import { tradingViewSlice } from './tradingView';
import { transfersSlice } from './transfers';
import { triggersFormSlice } from './triggersForm';
import { vaultsSlice } from './vaults';
import { walletSlice } from './wallet';

const reducers = {
  account: accountSlice.reducer,
  affiliates: affiliatesSlice.reducer,
  app: appSlice.reducer,
  appUiConfigs: appUiConfigsSlice.reducer,
  accountUiMemory: accountUiMemorySlice.reducer,
  dialogs: dialogsSlice.reducer,
  dismissable: dismissableSlice.reducer,
  funkitDeposits: funkitDepositsSlice.reducer,
  inputs: inputsSlice.reducer,
  triggersForm: triggersFormSlice.reducer,
  layout: layoutSlice.reducer,
  localization: localizationSlice.reducer,
  localOrders: localOrdersSlice.reducer,
  notifications: notificationsSlice.reducer,
  perpetuals: perpetualsSlice.reducer,
  tradingView: tradingViewSlice.reducer,
  transfers: transfersSlice.reducer,
  vaults: vaultsSlice.reducer,
  wallet: walletSlice.reducer,
  raw: rawSlice.reducer,
} as const;

const rootReducer = combineReducers(reducers);

const persistConfig = {
  key: 'root',
  version: 6,
  storage,
  whitelist: [
    'affiliates',
    'dismissable',
    'tradingView',
    'transfers',
    'wallet',
    'appUiConfigs',
    'accountUiMemory',
    'funkitDeposits',
  ],
  stateReconciler: autoMergeLevel2,
  migrate: customCreateMigrate({ debug: process.env.NODE_ENV !== 'production' }),
};

const persistedReducer = persistReducer<ReturnType<typeof rootReducer>>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(appMiddleware as Middleware, localizationMiddleware as Middleware),
  devTools:
    process.env.NODE_ENV !== 'production'
      ? {
          stateSanitizer: (state: any) => ({
            ...state,
            tradingView: '<LONG BLOB>',
            localization: { ...state.localization, localeData: '<LONG BLOB>' },
          }),
        }
      : false,
});

export const persistor = persistStore(store);

// Set store so (Abacus & localWalletManager) classes can getState and dispatch
abacusStateManager.setStore(store);
localWalletManager.setStore(store);

runFn(async () => {
  // we ignore the cleanups for now since we want these running forever
  storeLifecycles.forEach((fn) => fn(store));
});

export type RootStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = RootStore['dispatch'];
