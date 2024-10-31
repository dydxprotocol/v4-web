import { PersistedState } from 'redux-persist';

import { PersistAppStateV3, V3AppUiConfigs } from './3';

export type V4AppUiConfigs = Omit<V3AppUiConfigs, 'shouldHideLaunchableMarkets'>;

export type PersistAppStateV4 = PersistedState & {
  appUiConfigs: V4AppUiConfigs;
};

/**
 * Deprecate shouldHideLaunchableMarkets from AppUIConfigs state
 *
 */
export function migration4(state: PersistAppStateV3 | undefined): PersistAppStateV4 {
  if (!state) throw new Error('state must be defined');

  const appUiConfigsCopy = { ...state.appUiConfigs };

  // Remove shouldHideLaunchableMarkets
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { shouldHideLaunchableMarkets, ...restAppUiConfigs } = appUiConfigsCopy;

  return {
    ...state,
    appUiConfigs: restAppUiConfigs,
  };
}
