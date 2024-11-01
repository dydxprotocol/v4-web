import { afterEach, describe, expect, it } from 'vitest';

import { PersistAppStateV3, V3AppColorMode, V3AppTheme, V3DisplayUnit } from '../3';
import { migration4, PersistAppStateV4 } from '../4';

const v3State: PersistAppStateV3 = {
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

const v4State: PersistAppStateV4 = {
  _persist: { version: 4, rehydrated: true },
  appUiConfigs: {
    appThemeSetting: V3AppTheme.Classic,
    appColorMode: V3AppColorMode.GreenUp,
    hasSeenLaunchIncentives: false,
    defaultToAllMarketsInPositionsOrdersFills: true,
    displayUnit: V3DisplayUnit.Asset,
  },
};

describe('migration4', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('updated appUiConfigs state should not include shouldHideLaunchableMarkets', () => {
    const result = migration4(v3State);
    expect(result.appUiConfigs).toMatchObject(v4State.appUiConfigs);
  });
});
