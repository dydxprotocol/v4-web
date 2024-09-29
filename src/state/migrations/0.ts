import { PersistedState } from 'redux-persist';

import { LocalStorageKey } from '@/constants/localStorage';

import { parseStorageItem } from './utils';

/**
 * First migration (as an example), moving over tradingview chart configs
 *
 */
export function migration0(state: PersistedState) {
  if (!state) {
    throw new Error('state must be defined');
  }

  const oldTvChartConfig = parseStorageItem(
    localStorage.getItem(LocalStorageKey.TradingViewChartConfig)
  );
  localStorage.removeItem(LocalStorageKey.TradingViewChartConfig);

  return {
    ...state,
    tradingView: {
      chartConfig: oldTvChartConfig,
    },
  };
}
