import { combineReducers } from '@reduxjs/toolkit';
import * as assetPrices from './AssetPrices';
import * as assets from './Assets';
import * as candles from './Candles';
import * as marketConfigs from './MarketConfigs';

export const marketsReducer = combineReducers({
  assetPrices: assetPrices.slice.assetPricesReducer,
  marketConfigs: marketConfigs.slice.marketConfigsReducer,
  assets: assets.slice.assetsReducer,
});

export const marketsApis = {
  candlesApi: candles.api.candlesApi.reducer,
};

export const marketsMiddleware = [candles.api.candlesApi.middleware];

export type MarketsThunkExtra = assetPrices.thunks.AssetPricesThunkExtra &
  marketConfigs.thunks.MarketsConfigThunkExtra &
  candles.api.CandlesThunkExtra;

export { assetPrices, assets, candles, marketConfigs };
