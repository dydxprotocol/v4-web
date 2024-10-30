import { PersistedState } from 'redux-persist';

import { parseStorageItem } from './utils';

export enum DisplayUnit {
  Asset = 'asset',
  Fiat = 'fiat',
}

export enum AppTheme {
  Classic = 'Classic',
  Dark = 'Dark',
  Light = 'Light',
}

enum AppThemeSystemSetting {
  System = 'System',
}

type AppThemeSetting = AppTheme | AppThemeSystemSetting;

export enum AppColorMode {
  GreenUp = 'GreenUp',
  RedUp = 'RedUp',
}

export type V3AppUiConfigs = {
  appThemeSetting: AppThemeSetting;
  appColorMode: AppColorMode;
  hasSeenLaunchIncentives: boolean;
  defaultToAllMarketsInPositionsOrdersFills: boolean;
  displayUnit: DisplayUnit;
  shouldHideLaunchableMarkets: boolean;
};

export type PersistAppStateV3 = PersistedState & {
  appUiConfigs: V3AppUiConfigs;
};

export type AppUiConfigsKeys = keyof V3AppUiConfigs;
export type AppUIConfigsMappableLocalStorageKeys = keyof typeof appUiConfigsLocalStorageKeys;

interface V3AppUIConfigsState {
  appThemeSetting: AppThemeSetting;
  appColorMode: AppColorMode;
  hasSeenLaunchIncentives: boolean;
  defaultToAllMarketsInPositionsOrdersFills: boolean;
  displayUnit: DisplayUnit;
  shouldHideLaunchableMarkets: boolean;
}

const v3AppUiConfigsInitialState: V3AppUiConfigs = {
  appThemeSetting: AppTheme.Classic,
  appColorMode: AppColorMode.GreenUp,
  hasSeenLaunchIncentives: false,
  defaultToAllMarketsInPositionsOrdersFills: true,
  displayUnit: DisplayUnit.Asset,
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
