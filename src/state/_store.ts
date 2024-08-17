import { Middleware, configureStore } from '@reduxjs/toolkit';

import abacusStateManager from '@/lib/abacus';

import { accountSlice } from './account';
import { appSlice } from './app';
import appMiddleware from './appMiddleware';
import { assetsSlice } from './assets';
import { configsSlice } from './configs';
import { cosmosAccountSlice } from './cosmosAccount';
import { dialogsSlice } from './dialogs';
import { inputsSlice } from './inputs';
import { layoutSlice } from './layout';
import { localizationSlice } from './localization';
import localizationMiddleware from './localizationMiddleware';
import { notificationsSlice } from './notifications';
import { perpetualsSlice } from './perpetuals';
import { vaultsSlice } from './vaults';

export const store = configureStore({
  reducer: {
    account: accountSlice.reducer,
    app: appSlice.reducer,
    assets: assetsSlice.reducer,
    configs: configsSlice.reducer,
    cosmosAccount: cosmosAccountSlice.reducer,
    dialogs: dialogsSlice.reducer,
    inputs: inputsSlice.reducer,
    layout: layoutSlice.reducer,
    localization: localizationSlice.reducer,
    notifications: notificationsSlice.reducer,
    perpetuals: perpetualsSlice.reducer,
    vaults: vaultsSlice.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(appMiddleware as Middleware, localizationMiddleware as Middleware),

  devTools: process.env.NODE_ENV !== 'production',
});

// Set store so (Abacus & v4-Client) classes can getState and dispatch
abacusStateManager.setStore(store);

export type RootStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = RootStore['dispatch'];
