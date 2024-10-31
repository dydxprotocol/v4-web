import { PersistedState } from 'redux-persist';

import { parseStorageItem } from './utils';

export enum V3DisplayUnit {
  Asset = 'asset',
  Fiat = 'fiat',
}

export enum V3AppTheme {
  Classic = 'Classic',
  Dark = 'Dark',
  Light = 'Light',
}

export enum V3AppThemeSystemSetting {
  System = 'System',
}

export type V3AppThemeSetting = V3AppTheme | V3AppThemeSystemSetting;

export enum V3AppColorMode {
  GreenUp = 'GreenUp',
  RedUp = 'RedUp',
}

export type V3AppUiConfigs = {
  appThemeSetting: V3AppThemeSetting;
  appColorMode: V3AppColorMode;
  hasSeenLaunchIncentives: boolean;
  defaultToAllMarketsInPositionsOrdersFills: boolean;
  displayUnit: V3DisplayUnit;
  shouldHideLaunchableMarkets: boolean;
};

export type PersistAppStateV3 = PersistedState & {
  appUiConfigs: V3AppUiConfigs;
};

export type AppUiConfigsKeys = keyof V3AppUiConfigs;
export type AppUIConfigsMappableLocalStorageKeys = keyof typeof appUiConfigsLocalStorageKeys;

interface V3AppUIConfigsState {
  appThemeSetting: V3AppThemeSetting;
  appColorMode: V3AppColorMode;
  hasSeenLaunchIncentives: boolean;
  defaultToAllMarketsInPositionsOrdersFills: boolean;
  displayUnit: V3DisplayUnit;
  shouldHideLaunchableMarkets: boolean;
}

const v3AppUiConfigsInitialState: V3AppUiConfigs = {
  appThemeSetting: V3AppTheme.Classic,
  appColorMode: V3AppColorMode.GreenUp,
  hasSeenLaunchIncentives: false,
  defaultToAllMarketsInPositionsOrdersFills: true,
  displayUnit: V3DisplayUnit.Asset,
  shouldHideLaunchableMarkets: false,
};

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
        [key]: value ?? v3AppUiConfigsInitialState[key as AppUiConfigsKeys],
      };
    },
    {} as V3AppUIConfigsState
  );

  Object.values(appUiConfigsLocalStorageKeys).forEach((localStorageKey) => {
    if (localStorageKey) localStorage.removeItem(localStorageKey);
  });

  return {
    ...state,
    appUiConfigs,
  };
}
