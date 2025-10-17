import { BonsaiCore, BonsaiHelpers } from '@/bonsai/ontology';
// eslint-disable-next-line no-restricted-imports
import { Middleware, combineReducers, configureStore } from '@reduxjs/toolkit';
import { isFunction } from 'lodash';
import { persistReducer, persistStore } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import storage from 'redux-persist/lib/storage';

import { hdKeyManager, localWalletManager } from '@/lib/hdKeyManager';
import { transformOntologyObject } from '@/lib/transformOntology';

import { accountSlice } from './account';
import { accountUiMemorySlice } from './accountUiMemory';
import { affiliatesSlice } from './affiliates';
import { appSlice } from './app';
import appMiddleware from './appMiddleware';
import { appUiConfigsSlice } from './appUiConfigs';
import { closePositionFormSlice } from './closePositionForm';
import { dialogsSlice } from './dialogs';
import { dismissableSlice } from './dismissable';
import { getTriggersFormSummary } from './inputsSelectors';
import { layoutSlice } from './layout';
import { localOrdersSlice } from './localOrders';
import { localizationSlice } from './localization';
import localizationMiddleware from './localizationMiddleware';
import { customCreateMigrate } from './migrations';
import { notificationsSlice } from './notifications';
import { perpetualsSlice } from './perpetuals';
import { rawSlice } from './raw';
import { spotSlice } from './spot';
import { spotFormSlice } from './spotForm';
import { tradeFormSlice } from './tradeForm';
import { getClosePositionFormSummary, getTradeFormSummary } from './tradeFormSelectors';
import { tradingViewSlice } from './tradingView';
import { transfersSlice } from './transfers';
import { triggersFormSlice } from './triggersForm';
import { vaultsSlice } from './vaults';
import { walletEphemeralSlice, walletSlice } from './wallet';

const reducers = {
  account: accountSlice.reducer,
  affiliates: affiliatesSlice.reducer,
  app: appSlice.reducer,
  appUiConfigs: appUiConfigsSlice.reducer,
  accountUiMemory: accountUiMemorySlice.reducer,
  dialogs: dialogsSlice.reducer,
  dismissable: dismissableSlice.reducer,
  triggersForm: triggersFormSlice.reducer,
  tradeForm: tradeFormSlice.reducer,
  closePositionForm: closePositionFormSlice.reducer,
  spot: spotSlice.reducer,
  spotForm: spotFormSlice.reducer,
  layout: layoutSlice.reducer,
  localization: localizationSlice.reducer,
  localOrders: localOrdersSlice.reducer,
  notifications: notificationsSlice.reducer,
  perpetuals: perpetualsSlice.reducer,
  tradingView: tradingViewSlice.reducer,
  transfers: transfersSlice.reducer,
  vaults: vaultsSlice.reducer,
  wallet: walletSlice.reducer,
  walletEphemeral: walletEphemeralSlice.reducer,
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
  enhancers: (getDefaultEnhancers) =>
    getDefaultEnhancers({
      autoBatch: { type: 'timer', timeout: 250 },
    }),
  devTools:
    process.env.NODE_ENV !== 'production'
      ? {
          stateSanitizer: (state: any): any => ({
            ...state,
            tradingView: '<LONG BLOB>',
            localization: { ...state.localization, localeData: '<LONG BLOB>' },
            ontology: {
              core: transformOntologyObject(BonsaiCore, (a) => a(state)),
              helpers: transformOntologyObject(BonsaiHelpers, (a, path) => {
                const result = a(state);
                if (isFunction(result)) {
                  // this parameterized selector requires no arguments and is important
                  if (path === '.currentMarket.orderbook.selectGroupedData') {
                    return result(state);
                  }
                  return undefined;
                }
                return result;
              }),
              forms: {
                trade: getTradeFormSummary(state),
                closePosition: getClosePositionFormSummary(state),
                triggers: getTriggersFormSummary(state),
              },
            },
          }),
        }
      : false,
});

export const persistor = persistStore(store);

// Set store so localWalletManager classes can getState and dispatch
localWalletManager.setStore(store);
hdKeyManager.setStore(store);

export type RootStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = RootStore['dispatch'];
