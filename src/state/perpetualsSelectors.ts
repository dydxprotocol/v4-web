import { BonsaiCore, BonsaiHelpers } from '@/bonsai/ontology';
import { mapValues, pickBy } from 'lodash';

import { EMPTY_OBJ } from '@/constants/objects';

import { calculateMarketMaxLeverage } from '@/lib/marketsHelpers';
import { MaybeBigNumber } from '@/lib/numbers';
import { isPresent, orEmptyObj } from '@/lib/typeUtils';

import { type RootState } from './_store';
import { createAppSelector } from './appTypes';
import { getCurrentMarketId } from './currentMarketSelectors';

/**
 * @returns current market filter applied inside the markets page
 */
export const getMarketFilter = (state: RootState) => state.perpetuals.marketFilter;

/**
 * @returns displayId of the currentMarket the user is viewing (Render)
 */
export const getCurrentMarketDisplayId = createAppSelector(
  [BonsaiHelpers.currentMarket.stableMarketInfo],
  (m) => m?.displayableTicker
);

/**
 * @returns assetId of the currentMarket
 */
export const getCurrentMarketAssetId = createAppSelector(
  [BonsaiHelpers.currentMarket.stableMarketInfo],
  (m) => m?.assetId
);

/**
 * @returns marketIds of all markets
 */
export const getMarketIds = createAppSelector([BonsaiCore.markets.markets.data], (markets) =>
  Object.keys(markets ?? EMPTY_OBJ)
);

/**
 * @returns clobPairIds of all markets, mapped by marketId.
 */
export const getPerpetualMarketsClobIds = createAppSelector(
  [BonsaiCore.markets.markets.data],
  (markets) => {
    return pickBy(
      mapValues(markets, (m) => MaybeBigNumber(m.clobPairId)?.toNumber()),
      isPresent
    );
  }
);

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
export const getCurrentMarketOraclePrice = createAppSelector(
  [BonsaiHelpers.currentMarket.marketInfo],
  (m) => m?.oraclePrice
);

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
  [BonsaiHelpers.currentMarket.marketInfo],
  (marketData) => marketData?.nextFundingRate
);

/**
 * @returns Specified market's max leverage
 */
export const getMarketMaxLeverage = () =>
  createAppSelector([BonsaiHelpers.markets.createSelectMarketSummaryById()], (marketConfig) => {
    const { effectiveInitialMarginFraction, initialMarginFraction: initialMarginFractionStr } =
      orEmptyObj(marketConfig);
    const initialMarginFraction = MaybeBigNumber(initialMarginFractionStr)?.toNumber();
    return calculateMarketMaxLeverage({ effectiveInitialMarginFraction, initialMarginFraction });
  });

// Returns list of markets that user has launched to handle loading/navigation state
export const getLaunchedMarketIds = (state: RootState) => {
  return state.perpetuals.launchMarketIds;
};
