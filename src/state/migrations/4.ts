import { PersistState } from 'redux-persist';

import { initialState } from '../appUiConfigs';
import type { PersistAppStateV3, V3AppUiConfigs } from './3';

export type V4AppUiConfigs = V3AppUiConfigs & {
  favoritedMarkets: string[];
};

export type PersistAppStateV4 = { _persist: PersistState; appUiConfigs: V4AppUiConfigs };

/**
 * Migration to add favoritedMarkets to appUiConfigs
 */
export const migration4 = (state: PersistAppStateV3 | undefined): PersistAppStateV4 => {
  if (!state) throw new Error('state must be defined');

  return {
    ...state,
    appUiConfigs: {
      ...state.appUiConfigs,
      favoritedMarkets: initialState.favoritedMarkets,
    },
  };
};
