import { combineReducers } from '@reduxjs/toolkit';

import * as marketConfigs from './market-configs';
import * as oraclePrices from './oracle-prices';

export const marketsReducer = combineReducers({
  oraclePrices: oraclePrices.slice.oraclePricesReducer,
  marketConfigs: marketConfigs.slice.marketConfigsReducer,
});

export type MarketsThunkExtra = oraclePrices.thunks.OraclePricesThunkExtra &
  marketConfigs.thunks.MarketsConfigThunkExtra;
