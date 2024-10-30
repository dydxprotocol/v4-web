import { afterEach, describe, expect, it } from 'vitest';

import { V2State } from '../2';
import {
  appUiConfigsLocalStorageKeys,
  AppUIConfigsMappableLocalStorageKeys,
  migration3,
  PersistAppStateV3,
  V3AppColorMode,
  V3AppTheme,
  V3DisplayUnit,
} from '../3';

const V2_STATE: V2State = {
  _persist: { version: 2, rehydrated: true },
  dismissable: {
    hasSeenPredictionMarketIntroDialog: false,
    dismissedAffiliateBanner: false,
  },
};

const updatedState: PersistAppStateV3 = {
  _persist: { version: 3, rehydrated: true },
  appUiConfigs: {
    appThemeSetting: V3AppTheme.Classic,
    appColorMode: V3AppColorMode.GreenUp,
    hasSeenLaunchIncentives: false,
    defaultToAllMarketsInPositionsOrdersFills: true,
    displayUnit: V3DisplayUnit.Asset,
    shouldHideLaunchableMarkets: false,
  },
};

// values for testing -- they should be different than default / intial state
const oppositeUiConfigsLocalStorageValues = {
  appThemeSetting: V3AppTheme.Light,
  appColorMode: V3AppColorMode.RedUp,
  hasSeenLaunchIncentives: true,
  defaultToAllMarketsInPositionsOrdersFills: false,
  displayUnit: V3DisplayUnit.Fiat,
  shouldHideLaunchableMarkets: true,
} satisfies Record<AppUIConfigsMappableLocalStorageKeys, any>;

describe('migration3', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('should add the app ui configs to default values', () => {
    const result = migration3(V2_STATE);
    expect(result.appUiConfigs).toMatchObject(updatedState.appUiConfigs);
  });

  it('should overwrite the app ui configs if values exist', () => {
    const result = migration3(V2_STATE);
    expect(result.appUiConfigs).toMatchObject(updatedState.appUiConfigs);
  });

  it('should copy localStorage values to app ui configs object', () => {
    Object.entries(oppositeUiConfigsLocalStorageValues).forEach(([key, value]) => {
      localStorage.setItem(
        appUiConfigsLocalStorageKeys[key as AppUIConfigsMappableLocalStorageKeys],
        JSON.stringify(value)
      );
    });

    const result = migration3(V2_STATE);

    expect(result.appUiConfigs).toMatchObject({
      ...oppositeUiConfigsLocalStorageValues,
    });

    // Check if localStorage items were removed
    Object.values(appUiConfigsLocalStorageKeys).forEach((localStorageKey) => {
      expect(localStorage.getItem(localStorageKey)).toBeNull();
    });
  });
});
