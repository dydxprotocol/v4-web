import { PersistedState, PersistState } from 'redux-persist';

import { DisplayUnit } from '@/constants/trade';

import {
  AppColorMode,
  AppThemeSetting,
  initialState as appUiConfigsInitialState,
  AppUIConfigsState,
} from '../appUiConfigs';
import { parseStorageItem } from './utils';

export type V3AppUiConfigs = {
  appThemeSetting: AppThemeSetting;
  appColorMode: AppColorMode;
  hasSeenLaunchIncentives: boolean;
  defaultToAllMarketsInPositionsOrdersFills: boolean;
  displayUnit: DisplayUnit;
  shouldHideLaunchableMarkets: boolean;
};

export type PersistAppStateV3 = {
  _persist: PersistState;
  appUiConfigs: V3AppUiConfigs;
};

export type AppUiConfigsKeys = keyof V3AppUiConfigs;
export type AppUIConfigsMappableLocalStorageKeys = keyof typeof appUiConfigsLocalStorageKeys;

export const appUiConfigsLocalStorageKeys = {
  appThemeSetting: 'dydx.SelectedTheme',
  appColorMode: 'dydx.SelectedColorMode',
  hasSeenLaunchIncentives: 'dydx.HasSeenLaunchIncentives',
  defaultToAllMarketsInPositionsOrdersFills: 'dydx.DefaultToAllMarketsInPositionsOrdersFills',
  displayUnit: 'dydx.SelectedDisplayUnit',
  shouldHideLaunchableMarkets: 'dydx.ShouldHideLaunchableMarkets',
};

/**
 * 4th migration, moving over the app ui configs localStorage items
 *
 */
export function migration3(state: PersistedState | undefined): PersistAppStateV3 {
  if (!state) throw new Error('state must be defined');

  const appUiConfigs = Object.entries(appUiConfigsLocalStorageKeys).reduce(
    (acc, [key, localStorageKey]) => {
      const value = parseStorageItem(localStorage.getItem(localStorageKey));

      return {
        ...acc,
        [key]: value ?? appUiConfigsInitialState[key as AppUiConfigsKeys],
      };
    },
    {} as AppUIConfigsState
  );

  Object.values(appUiConfigsLocalStorageKeys).forEach((localStorageKey) => {
    if (localStorageKey) localStorage.removeItem(localStorageKey);
  });

  return {
    ...state,
    appUiConfigs,
  };
}
