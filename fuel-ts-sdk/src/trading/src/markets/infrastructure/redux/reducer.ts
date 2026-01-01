import { combineReducers } from '@reduxjs/toolkit';
import * as assetPrices from './asset-prices';
import * as candles from './candles';
import * as marketConfigs from './market-configs';

export const marketsReducer = {
  markets: combineReducers({
    assetPrices: assetPrices.slice.assetPricesReducer,
    marketConfigs: marketConfigs.slice.marketConfigsReducer,
  }),
  [candles.api.candlesApi.reducerPath]: candles.api.candlesApi.reducer,
};

export const marketsMiddleware = [candles.api.candlesApi.middleware];

export type MarketsThunkExtra = assetPrices.thunks.AssetPricesThunkExtra &
  marketConfigs.thunks.MarketsConfigThunkExtra &
  candles.api.CandlesThunkExtra;

export { assetPrices, candles, marketConfigs };
