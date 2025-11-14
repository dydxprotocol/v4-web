import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, type DydxNetwork } from '@/constants/networks';

import { getLocalStorage } from '@/lib/localStorage';
import { validateAgainstAvailableEnvironments } from '@/lib/network';

export interface AppState {
  pageLoaded: boolean;
  initializationError?: string;
  selectedNetwork: DydxNetwork;
  currentPath: string;
}

const initialState: AppState = {
  initializationError: undefined,
  pageLoaded: false,
  selectedNetwork: getLocalStorage({
    key: LocalStorageKey.SelectedNetwork,
    defaultValue: DEFAULT_APP_ENVIRONMENT,
    validateFn: validateAgainstAvailableEnvironments,
  }),
  currentPath: '/',
};

export const appSlice = createSlice({
  name: 'App',
  initialState,
  reducers: {
    initializeLocalization: (state: AppState) => ({
      ...state,
      pageLoaded: true,
    }),
    setSelectedNetwork: (state: AppState, action: PayloadAction<DydxNetwork>) => ({
      ...state,
      selectedNetwork: action.payload,
    }),
    setInitializationError: (state: AppState, action: PayloadAction<string | undefined>) => {
      state.initializationError = action.payload;
    },
    setCurrentPath: (state: AppState, action: PayloadAction<string>) => {
      state.currentPath = action.payload;
    },
  },
});

export const {
  initializeLocalization,
  setSelectedNetwork,
  setInitializationError,
  setCurrentPath,
} = appSlice.actions;
