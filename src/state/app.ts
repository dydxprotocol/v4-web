import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AbacusApiState } from '@/constants/abacus';
import { LocalStorageKey } from '@/constants/localStorage';

import { DEFAULT_APP_ENVIRONMENT, type DydxNetwork } from '@/constants/networks';

import { getLocalStorage } from '@/lib/localStorage';

export interface AppState {
  apiState: AbacusApiState | undefined;
  pageLoaded: boolean;
  selectedNetwork: DydxNetwork;
}

const initialState: AppState = {
  apiState: undefined,
  pageLoaded: false,
  selectedNetwork: getLocalStorage({
    key: LocalStorageKey.SelectedNetwork,
    defaultValue: DEFAULT_APP_ENVIRONMENT,
  }),
};

export const appSlice = createSlice({
  name: 'App',
  initialState,
  reducers: {
    initializeLocalization: (state: AppState) => ({
      ...state,
      pageLoaded: true,
    }),
    initializeWebsocket: (state: AppState) => state,
    setApiState: (state: AppState, action: PayloadAction<AbacusApiState>) => ({
      ...state,
      apiState: action.payload,
    }),
    setSelectedNetwork: (state: AppState, action: PayloadAction<DydxNetwork>) => ({
      ...state,
      selectedNetwork: action.payload,
    }),
  },
});

export const { initializeLocalization, initializeWebsocket, setApiState, setSelectedNetwork } =
  appSlice.actions;
