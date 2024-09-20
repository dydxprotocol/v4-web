import { createSlice } from '@reduxjs/toolkit';

import { AbacusApiState } from '@/constants/abacus';
import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, type DydxNetwork } from '@/constants/networks';

import { getLocalStorage } from '@/lib/localStorage';
import { validateAgainstAvailableEnvironments } from '@/lib/network';
import { generateTypedSetterActions } from '@/lib/sliceActionGenerators';

export interface AppState {
  apiState: AbacusApiState | undefined;
  pageLoaded: boolean;
  initializationError?: string;
  selectedNetwork: DydxNetwork;
}

const initialState: AppState = {
  initializationError: undefined,
  apiState: undefined,
  pageLoaded: false,
  selectedNetwork: getLocalStorage({
    key: LocalStorageKey.SelectedNetwork,
    defaultValue: DEFAULT_APP_ENVIRONMENT,
    validateFn: validateAgainstAvailableEnvironments,
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
    ...generateTypedSetterActions(initialState),
  },
});

export const { initializeLocalization, setApiState, setSelectedNetwork, setInitializationError } =
  appSlice.actions;
