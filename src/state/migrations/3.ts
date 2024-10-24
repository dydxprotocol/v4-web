import { PersistedState } from 'redux-persist';

import { AppUIConfigsState, initialState as appUiConfigsInitialState } from '../appUiConfigs';
import { parseStorageItem } from './utils';

export type V3State = PersistedState & {
  appUiConfigs: AppUIConfigsState;
};

export type AppUiConfigsKeys = keyof typeof appUiConfigsInitialState;
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
export function migration3(state: PersistedState | undefined): V3State {
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
    localStorage.removeItem(localStorageKey);
  });

  return {
    ...state,
    appUiConfigs: {
      ...appUiConfigs,
      // rest of values that were not stored in localStorage
      favoritedMarkets: [],
    },
  };
}
