import { matchPath } from 'react-router-dom';
import { createSelector } from 'reselect';

import { Candle, TradingViewBar } from '@/constants/candles';
import { TRADE_ROUTE } from '@/constants/routes';

import type { RootState } from './_store';
import { mapCandle } from '@/lib/tradingView/utils';

/**
 * @param state
 * @returns marketId of the market the user is currently viewing
 */
export const getCurrentMarketId = (state: RootState) => state.perpetuals.currentMarketId;

/**
 * @returns assetId of the currentMarket
 */
export const getCurrentMarketAssetId = (state: RootState) => {
  const currentMarketId = getCurrentMarketId(state) || '';
  return state.perpetuals?.markets?.[currentMarketId]?.assetId;
};

/**
 * @param state
 * @returns Record of PerpetualMarket indexed by MarketId
 */
export const getPerpetualMarkets = (state: RootState) => state.perpetuals.markets;

/**
 * @param marketId
 * @returns PerpetualMarket data of the specified marketId
 */
export const getMarketData = (marketId: string) => (state: RootState) =>
  getPerpetualMarkets(state)?.[marketId];

/**
 * @param state
 * @returns marketIds of all markets
 */
export const getMarketIds = (state: RootState) => Object.keys(getPerpetualMarkets(state) ?? []);

/**
 * @param state
 * @returns PerpetualMarket data of the market the user is currently viewing
 */
export const getCurrentMarketData = (state: RootState) => {
  const currentMarketId = getCurrentMarketId(state);
  return currentMarketId ? getPerpetualMarkets(state)?.[currentMarketId] : undefined;
};

/**
 * @param state
 * @returns MarketConfig data of the market the user is currently viewing
 */
export const getCurrentMarketConfig = (state: RootState) => getCurrentMarketData(state)?.configs;

/**
 * @param marketId
 * @returns config for specified market
 */
export const getMarketConfig = (marketId: string) => (state: RootState) =>
  getMarketData(marketId)(state)?.configs;

/**
 * @param state
 * @returns Record of list of MarketTrades indexed by marketId
 */
export const getLiveTrades = (state: RootState) => state.perpetuals.liveTrades;

/**
 * @param state
 * @returns List of MarketTrades of the market the user is currently viewing
 */
export const getCurrentMarketLiveTrades = (state: RootState) => {
  const liveTrades = getLiveTrades(state);
  const currentMarketId = getCurrentMarketId(state);
  return currentMarketId ? liveTrades?.[currentMarketId] ?? [] : [];
};

/**
 * @param state
 * @returns Record of subscribed or previously subscribed Orderbook data, indexed by marketId.
 */
export const getOrderbooks = (state: RootState) => state.perpetuals.orderbooks;

/**
 * @param state
 * @returns Orderbook data for the market the user is currently viewing
 */
export const getCurrentMarketOrderbook = (state: RootState) => {
  const orderbookData = getOrderbooks(state);
  const currentMarketId = getCurrentMarketId(state);
  return orderbookData?.[currentMarketId || ''];
};

/**
 * @param state
 * @returns Record of historical funding indexed by marketId.
 */
export const getHistoricalFundings = (state: RootState) => state.perpetuals.historicalFundings;

/**
 * @param state
 * @returns Historical funding data for the market the user is currently viewing
 */
export const getCurrentMarketHistoricalFundings = createSelector(
  [getHistoricalFundings, getCurrentMarketId],
  (historicalFundings, currentMarketId) =>
    currentMarketId ? historicalFundings?.[currentMarketId] ?? [] : []
);

/**
 * @param state
 * @returns Mid market price for the market the user is currently viewing
 */
export const getCurrentMarketMidMarketPrice = (state: RootState) => {
  const currentMarketOrderbook = getCurrentMarketOrderbook(state);
  return currentMarketOrderbook?.midPrice;
};

/**
 *
 * @param marketId
 * @param resolution
 * @returns candle data for specified marketId and resolution
 */
export const getPerpetualCandlesForMarket =
  (marketId: string, resolution: string) =>
  (state: RootState): Candle[] =>
    state.perpetuals.candles?.[marketId]?.data?.[resolution] ?? [];

/**
 *
 * @param marketId
 * @param resolution
 * @returns TradingViewBar data for specified marketId and resolution
 */
export const getPerpetualBarsForPriceChart = (marketId: string, resolution: string) =>
  createSelector(
    [getPerpetualCandlesForMarket(marketId, resolution)],
    (candles): TradingViewBar[] => candles.map(mapCandle)
  );

/**
 *
 * @param marketId
 * @returns TvChart resolution for specified marketId
 */
export const getSelectedResolutionForMarket = (marketId: string) => (state: RootState) =>
  state.perpetuals.candles?.[marketId]?.selectedResolution;

/**
 * @param state
 * @returns Current market's next funding rate
 */
export const getCurrentMarketNextFundingRate = createSelector(
  [getCurrentMarketData],
  (marketData) => marketData?.perpetual?.nextFundingRate
);
