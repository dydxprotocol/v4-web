import { afterEach, describe, expect, it } from 'vitest';

import { DisplayUnit } from '@/constants/trade';

import { AppColorMode, AppTheme } from '@/state/appUiConfigs';

import { PersistAppStateV3 } from '../3';
import { migration4, PersistAppStateV4 } from '../4';

const previousState: PersistAppStateV3 = {
  _persist: { version: 3, rehydrated: true },
  appUiConfigs: {
    appThemeSetting: AppTheme.Dark,
    appColorMode: AppColorMode.GreenUp,
    hasSeenLaunchIncentives: false,
    defaultToAllMarketsInPositionsOrdersFills: true,
    displayUnit: DisplayUnit.Asset,
    shouldHideLaunchableMarkets: false,
  },
};

const updatedState: PersistAppStateV4 = {
  _persist: { version: 4, rehydrated: true },
  appUiConfigs: {
    appThemeSetting: AppTheme.Dark,
    appColorMode: AppColorMode.GreenUp,
    hasSeenLaunchIncentives: false,
    defaultToAllMarketsInPositionsOrdersFills: true,
    displayUnit: DisplayUnit.Asset,
    shouldHideLaunchableMarkets: false,
    favoritedMarkets: [],
  },
};

describe('migration4', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('should add favoritedMarkets to appUiConfigs', () => {
    const result = migration4(previousState);
    expect(result.appUiConfigs.favoritedMarkets).toEqual([]);
  });

  it('should not change previousState', () => {
    const result = migration4(previousState);
    expect(result.appUiConfigs).toEqual(updatedState.appUiConfigs);
  });
});
