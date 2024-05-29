import { Candle, TradingViewBar } from '@/constants/candles';

import { mapCandle } from '@/lib/tradingView/utils';

import { type RootState } from './_store';
import { createAppSelector } from './appTypes';

/**
 * @returns current market filter applied inside the markets page
 */
export const getMarketFilter = (state: RootState) => state.perpetuals.marketFilter;

/**
 * @returns marketId of the market the user is currently viewing
 */
export const getCurrentMarketId = (state: RootState) => state.perpetuals.currentMarketId;

/**
 * @returns assetId of the currentMarket
 */
export const getCurrentMarketAssetId = (state: RootState) => {
  const currentMarketId = getCurrentMarketId(state) ?? '';
  return state.perpetuals?.markets?.[currentMarketId]?.assetId;
};

/**
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
 * @returns marketIds of all markets
 */
export const getMarketIds = (state: RootState) => Object.keys(getPerpetualMarkets(state) ?? []);

/**
 * @returns PerpetualMarket data of the market the user is currently viewing
 */
export const getCurrentMarketData = (state: RootState) => {
  const currentMarketId = getCurrentMarketId(state);
  return currentMarketId ? getPerpetualMarkets(state)?.[currentMarketId] : undefined;
};

/**
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
 * @returns Record of list of MarketTrades indexed by marketId
 */
export const getLiveTrades = (state: RootState) => state.perpetuals.liveTrades;

/**
 * @returns List of MarketTrades of the market the user is currently viewing
 */
export const getCurrentMarketLiveTrades = (state: RootState) => {
  const liveTrades = getLiveTrades(state);
  const currentMarketId = getCurrentMarketId(state);
  return currentMarketId ? liveTrades?.[currentMarketId] ?? [] : [];
};

/**
 * @returns Record of subscribed or previously subscribed Orderbook data, indexed by marketId.
 */
export const getOrderbooks = (state: RootState) => state.perpetuals.orderbooks;

/**
 * @returns Orderbook data for the market the user is currently viewing
 */
export const getCurrentMarketOrderbook = (state: RootState) => {
  const orderbookData = getOrderbooks(state);
  const currentMarketId = getCurrentMarketId(state);
  return orderbookData?.[currentMarketId ?? ''];
};

/**
 * @returns Orderbook data as a Map of price and size for the current market
 */
export const getCurrentMarketOrderbookMap = (state: RootState) => {
  const orderbookMap = state.perpetuals.orderbooksMap;
  const currentMarketId = getCurrentMarketId(state);
  return orderbookMap?.[currentMarketId ?? ''];
};

/**
 * @returns Record of historical funding indexed by marketId.
 */
export const getHistoricalFundings = (state: RootState) => state.perpetuals.historicalFundings;

/**
 * @returns Historical funding data for the market the user is currently viewing
 */
export const getCurrentMarketHistoricalFundings = createAppSelector(
  [getHistoricalFundings, getCurrentMarketId],
  (historicalFundings, currentMarketId) =>
    currentMarketId ? historicalFundings?.[currentMarketId] ?? [] : []
);

/**
 * @returns oracle price of the market the user is currently viewing
 */
export const getCurrentMarketOraclePrice = (state: RootState) =>
  getCurrentMarketData(state)?.oraclePrice;

/**
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
export const getPerpetualCandlesForMarket = (
  state: RootState,
  marketId: string,
  resolution: string
): Candle[] => state.perpetuals.candles?.[marketId]?.data?.[resolution] ?? [];

/**
 *
 * @param marketId
 * @param resolution
 * @returns TradingViewBar data for specified marketId and resolution
 */
export const getPerpetualBarsForPriceChart = () =>
  createAppSelector(
    [
      (state: RootState, marketId: string, resolution: string) =>
        getPerpetualCandlesForMarket(state, marketId, resolution),
    ],
    (candles): TradingViewBar[] => candles.map(mapCandle)
  );

/**
 *
 * @param marketId
 * @returns TvChart resolution for specified marketId
 */
export const getSelectedResolutionForMarket = (state: RootState, marketId: string) =>
  state.perpetuals.candles?.[marketId]?.selectedResolution;

/**
 * @returns Current market's next funding rate
 */
export const getCurrentMarketNextFundingRate = createAppSelector(
  [getCurrentMarketData],
  (marketData) => marketData?.perpetual?.nextFundingRate
);
