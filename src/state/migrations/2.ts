import { PersistedState } from 'redux-persist';

import { DismissableState } from '../dismissable';
import { parseStorageItem } from './utils';

export type V2State = PersistedState & { dismissable: DismissableState };
/**
 * Third migration, moving over the hasSeenPredictionMarketsIntro localStorage item
 *
 */
export function migration2(state: PersistedState | undefined): V2State {
  if (!state) {
    throw new Error('state must be defined');
  }

  const hasSeenPredictionMarketsIntro = parseStorageItem<boolean>(
    localStorage.getItem('dydx.HasSeenPredictionMarketsIntro')
  );

  localStorage.removeItem('dydx.HasSeenPredictionMarketsIntro');

  return {
    ...state,
    dismissable: {
      hasSeenPredictionMarketIntroDialog: hasSeenPredictionMarketsIntro ?? false,
    },
  };
}
