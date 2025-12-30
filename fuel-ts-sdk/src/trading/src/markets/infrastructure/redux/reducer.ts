import { combineReducers } from '@reduxjs/toolkit';
import * as assetPrices from './asset-prices';
import * as candles from './candles';
import * as marketConfigs from './market-configs';

export const marketsReducer = combineReducers({
  assetPrices: assetPrices.slice.assetPricesReducer,
  marketConfigs: marketConfigs.slice.marketConfigsReducer,
  candles: candles.slice.candlesReducer,
});

export type MarketsThunkExtra = assetPrices.thunks.AssetPricesThunkExtra &
  marketConfigs.thunks.MarketsConfigThunkExtra &
  candles.thunks.CandlesThunkExtra;

export { assetPrices, candles, marketConfigs };
