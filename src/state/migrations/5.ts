import { PersistedState } from 'redux-persist';

type PersistAppStateV5 = PersistedState & {
  transfers: {};
};

/**
 * Initiates slice for withdraws and deposits
 */
export function migration5(state: PersistedState | undefined): PersistAppStateV5 {
  if (!state) throw new Error('state must be defined');

  return {
    ...state,
    transfers: {
      transfersByDydxAddress: {},
    },
  };
}
