import { afterEach, describe, expect, it } from 'vitest';

import { DisplayUnit } from '@/constants/trade';

import { AppColorMode, AppTheme } from '@/state/appUiConfigs';

import { V2State } from '../2';
import {
  appUiConfigsLocalStorageKeys,
  AppUIConfigsMappableLocalStorageKeys,
  migration3,
  PersistAppStateV3,
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
    appThemeSetting: AppTheme.Classic,
    appColorMode: AppColorMode.GreenUp,
    hasSeenLaunchIncentives: false,
    defaultToAllMarketsInPositionsOrdersFills: true,
    displayUnit: DisplayUnit.Asset,
    shouldHideLaunchableMarkets: false,
  },
};

// values for testing -- they should be different than default / intial state
const oppositeUiConfigsLocalStorageValues = {
  appThemeSetting: AppTheme.Light,
  appColorMode: AppColorMode.RedUp,
  hasSeenLaunchIncentives: true,
  defaultToAllMarketsInPositionsOrdersFills: false,
  displayUnit: DisplayUnit.Fiat,
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
