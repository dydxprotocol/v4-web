import { PersistedState } from 'redux-persist';

export type PersistAppStateV6 = PersistedState & {
  affiliates: {
    latestReferrer: string | undefined;
  };
};

/**
 * Resets the saved referrer. Referrers are now saved when the user accepts the referral dialog.
 */
export function migration6(state: PersistedState | undefined): PersistAppStateV6 {
  if (!state) throw new Error('state must be defined');

  return {
    ...state,
    affiliates: {
      latestReferrer: undefined,
    },
  };
}
