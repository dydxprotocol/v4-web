import { mapValues } from 'lodash';

import { Nullable } from '@/constants/abacus';
import { EMPTY_OBJ } from '@/constants/objects';

import { calculateMarketMaxLeverage } from '@/lib/marketsHelpers';
import { orEmptyObj } from '@/lib/typeUtils';

import { type RootState } from './_store';
import { createAppSelector } from './appTypes';

/**
 * @returns current market filter applied inside the markets page
 */
export const getMarketFilter = (state: RootState) => state.perpetuals.marketFilter;

/**
 * @returns marketId of the market the user is currently viewing (Internal)
 */
export const getCurrentMarketId = (state: RootState) => state.perpetuals.currentMarketId;

/**
 * @returns marketId of the market the user is currently viewing if it is tradeable (Internal)
 */
export const getCurrentMarketIdIfTradeable = (state: RootState) =>
  state.perpetuals.currentMarketIdIfTradeable;

/**
 * @returns displayId of the currentMarket the user is viewing (Render)
 */
export const getCurrentMarketDisplayId = (state: RootState) => {
  const currentMarketId = getCurrentMarketId(state) ?? '';
  return state.perpetuals.markets?.[currentMarketId]?.displayId;
};

/**
 * @returns assetId of the currentMarket
 */
export const getCurrentMarketAssetId = (state: RootState) => {
  const currentMarketId = getCurrentMarketId(state) ?? '';
  return state.perpetuals.markets?.[currentMarketId]?.assetId;
};

/**
 * @returns Record of PerpetualMarket indexed by MarketId
 */
export const getPerpetualMarkets = (state: RootState) => state.perpetuals.markets;

/**
 * @param marketId
 * @returns PerpetualMarket data of the specified marketId
 */
export const getMarketData = (state: RootState, marketId: string) =>
  getPerpetualMarkets(state)?.[marketId];

/**
 * @returns marketIds of all markets
 */
export const getMarketIds = (state: RootState) =>
  Object.keys(getPerpetualMarkets(state) ?? EMPTY_OBJ);

/**
 * @returns clobPairIds of all markets, mapped by marketId.
 */
export const getPerpetualMarketsClobIds = createAppSelector([getPerpetualMarkets], (markets) => {
  return Object.entries(markets ?? {}).reduce(
    (acc, [marketId, market]) => {
      const clobPairId: Nullable<string> = market.configs?.clobPairId;
      if (clobPairId !== undefined) {
        acc[marketId] = Number(clobPairId);
      }
      return acc;
    },
    {} as Record<string, number>
  );
});

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
export const getMarketConfig = (state: RootState, marketId: string) =>
  getMarketData(state, marketId)?.configs;

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
 * @returns oracle price of the market the user is currently viewing
 */
export const getCurrentMarketOraclePrice = (state: RootState) =>
  getCurrentMarketData(state)?.oraclePrice;

/**
 * @param marketId
 * @returns oraclePrice of specified marketId
 */
export const getMarketOraclePrice = (state: RootState, marketId: string) =>
  getMarketData(state, marketId)?.oraclePrice;

/**
 * @returns Mid market price for the market the user is currently viewing
 */
export const getCurrentMarketMidMarketPrice = (state: RootState) => {
  const currentMarketOrderbook = getCurrentMarketOrderbook(state);
  return currentMarketOrderbook?.midPrice;
};

export const getCurrentMarketMidMarketPriceWithOraclePriceFallback = createAppSelector(
  [getCurrentMarketMidMarketPrice, getCurrentMarketOraclePrice],
  (midMarketPrice, oraclePrice) => midMarketPrice ?? oraclePrice
);

/**
 * @returns Current market's next funding rate
 */
export const getCurrentMarketNextFundingRate = createAppSelector(
  [getCurrentMarketData],
  (marketData) => marketData?.perpetual?.nextFundingRate
);

export const getMarketIdToAssetMetadataMap = createAppSelector(
  [(state: RootState) => state.perpetuals.markets, (state: RootState) => state.assets.assets],
  (markets, assets) => {
    const mapping = mapValues(markets ?? {}, (v) => assets?.[v.assetId]);
    return mapping;
  }
);

/**
 * @returns Specified market's max leverage
 */
export const getMarketMaxLeverage = () =>
  createAppSelector(
    [
      (state: RootState, marketId?: string) =>
        marketId != null ? getMarketConfig(state, marketId) : undefined,
    ],
    (marketConfig) => {
      const { effectiveInitialMarginFraction, initialMarginFraction } = orEmptyObj(marketConfig);

      return calculateMarketMaxLeverage({ effectiveInitialMarginFraction, initialMarginFraction });
    }
  );

// Returns list of markets that user has launched to handle loading/navigation state
export const getLaunchedMarketIds = (state: RootState) => {
  return state.perpetuals.launchMarketIds;
};
