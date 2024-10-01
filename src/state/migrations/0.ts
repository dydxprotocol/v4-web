import { PersistedState } from 'redux-persist';

import { parseStorageItem } from './utils';

export type V0State = PersistedState & { tradingView: { chartConfig?: object } };
/**
 * First migration (as an example), moving over tradingview chart configs
 *
 */
export function migration0(state: PersistedState | undefined): V0State {
  if (!state) {
    throw new Error('state must be defined');
  }

  const oldTvChartConfig = parseStorageItem<object>(
    localStorage.getItem('dydx.TradingViewChartConfig')
  );
  localStorage.removeItem('dydx.TradingViewChartConfig');

  return {
    ...state,
    tradingView: {
      chartConfig: oldTvChartConfig,
    },
  };
}
