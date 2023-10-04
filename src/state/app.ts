import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AbacusApiState } from '@/constants/abacus';
import { LocalStorageKey } from '@/constants/localStorage';

import {
  DEFAULT_APP_ENVIRONMENT,
  ENVIRONMENT_CONFIG_MAP,
  type DydxNetwork,
} from '@/constants/networks';

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
    validateFn: (value) => Object.keys(ENVIRONMENT_CONFIG_MAP).includes(value),
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
