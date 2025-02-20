import { BonsaiCore, BonsaiHelpers } from '@/bonsai/ontology';
import { PositionUniqueId, SubaccountFill, SubaccountOrder } from '@/bonsai/types/summaryTypes';
import { groupBy, keyBy, mapValues } from 'lodash';

import { OnboardingState } from '@/constants/account';
import { EMPTY_ARR } from '@/constants/objects';
import { IndexerOrderSide, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { mapIfPresent } from '@/lib/do';
import {
  getAverageFillPrice,
  getHydratedFill,
  getHydratedOrder,
  isStopLossOrderNew,
  isTakeProfitOrderNew,
} from '@/lib/orders';

import { type RootState } from './_store';
import { getUserWalletAddress } from './accountInfoSelectors';
import { ALL_MARKETS_STRING } from './accountUiMemory';
import { getSelectedNetwork } from './appSelectors';
import { createAppSelector } from './appTypes';
import { getCurrentMarketId } from './currentMarketSelectors';

/**
 * @param state
 * @returns Abacus' subaccount object
 */
export const getSubaccount = BonsaiCore.account.parentSubaccountSummary.data;

export const getSubaccountForPostOrder = (s: RootState) => s.account.subaccountForPostOrders;

/**
 * @param state
 * @returns list of a subaccount's open positions. Each item in the list is an open position in a different market.
 */
export const getOpenPositions = BonsaiCore.account.parentSubaccountPositions.data;

/**
 *
 * @returns All SubaccountOrders that have a margin mode of Isolated and no existing position for the market.
 */
export const getNonZeroPendingPositions = createAppSelector(
  [BonsaiHelpers.unopenedIsolatedPositions],
  (pending) => pending?.filter((p) => p.equity.toNumber() > 0)
);

export const getOpenPositionFromId = () =>
  createAppSelector(
    [getOpenPositions, (s, positionId: PositionUniqueId) => positionId],
    (allOpenPositions, positionId) =>
      allOpenPositions?.find(({ uniqueId }) => uniqueId === positionId)
  );

export const getOpenPositionFromIdForPostOrder = () =>
  createAppSelector(
    [(s) => s.account.subaccountForPostOrders?.openPositions, (s, marketId: string) => marketId],
    (allOpenPositions, marketId) => allOpenPositions?.toArray().find(({ id }) => id === marketId)
  );

/**
 * @param state
 * @returns AccountPositions of the current market
 */
export const getCurrentMarketPositionData = createAppSelector(
  [getCurrentMarketId, getOpenPositions],
  (marketId, positions) => {
    return positions?.find((p) => p.market === marketId);
  }
);

/**
 * @param state
 * @returns AccountPositions of the current market
 */
export const getCurrentMarketPositionDataForPostTrade = createAppSelector(
  [getCurrentMarketId, (s) => s.account.subaccountForPostOrders?.openPositions],
  (marketId, positions) => {
    return positions?.toArray().find((p) => p.id === marketId);
  }
);

/**
 * @param state
 * @returns list of orders for the currently connected subaccount
 */
export const getSubaccountOrders = BonsaiCore.account.allOrders.data;

/**
 * @param state
 * @returns Record of SubaccountOrders indexed by marketId
 */
export const getMarketOrders = createAppSelector(
  [BonsaiCore.account.openOrders.data],
  (orders): { [marketId: string]: SubaccountOrder[] } => {
    return groupBy(orders, (o) => o.marketId);
  }
);

/**
 * @param state
 * @returns SubaccountOrders of the current market
 */
export const getCurrentMarketOrders = createAppSelector(
  [getCurrentMarketId, getMarketOrders],
  (currentMarketId, marketOrders): SubaccountOrder[] =>
    !currentMarketId ? EMPTY_ARR : marketOrders[currentMarketId] ?? EMPTY_ARR
);

export const getCurrentMarketOrdersForPostOrder = createAppSelector(
  [getCurrentMarketId, (s) => s.account.subaccountForPostOrders?.orders],
  (currentMarketId, marketOrders) =>
    !currentMarketId
      ? EMPTY_ARR
      : marketOrders?.toArray().filter((o) => o.marketId === currentMarketId) ?? EMPTY_ARR
);

/**
 * @param state
 * @returns list of orders that have not been filled or cancelled
 */
export const getSubaccountOpenOrders = BonsaiCore.account.openOrders.data;

/**
 * @param state
 * @returns order with the specified id
 */
export const getOrderById = () =>
  createAppSelector([getSubaccountOrders, (s, orderId: string) => orderId], (orders, orderId) =>
    orders.find((order) => order.id === orderId)
  );

/**
 * @param state
 * @returns order with the specified client id
 */
export const getOrderByClientId = () =>
  createAppSelector(
    [getSubaccountOrders, (s, orderClientId: string) => orderClientId],
    (orders, orderClientId) => orders.find((order) => order.clientId === orderClientId)
  );

/**
 * @param state
 * @returns first matching fill with the specified order client id
 */
export const getFillByClientId = () =>
  createAppSelector([getSubaccountFills, getOrderByClientId()], (fills, order) =>
    fills.find((fill) => fill.orderId === order?.id)
  );

/**
 * @param state
 * @returns list of conditional orders that have not been filled or cancelled for all subaccount positions
 */
export const getSubaccountConditionalOrders = () =>
  createAppSelector(
    [
      BonsaiCore.account.openOrders.data,
      BonsaiCore.account.parentSubaccountPositions.data,
      (s, isSlTpLimitOrdersEnabled: boolean) => isSlTpLimitOrdersEnabled,
    ],
    (orders, positions, isSlTpLimitOrdersEnabled) => {
      const openOrdersByPositionUniqueId = groupBy(orders, (o) => o.positionUniqueId);

      return mapValues(
        keyBy(positions, (p) => p.uniqueId),
        (position) => {
          const orderSideForConditionalOrder =
            position.side === IndexerPositionSide.LONG
              ? IndexerOrderSide.SELL
              : IndexerOrderSide.BUY;

          const conditionalOrders = openOrdersByPositionUniqueId[position.uniqueId];

          return {
            stopLossOrders: conditionalOrders?.filter(
              (order) =>
                order.side === orderSideForConditionalOrder &&
                isStopLossOrderNew(order, isSlTpLimitOrdersEnabled)
            ),
            takeProfitOrders: conditionalOrders?.filter(
              (order) =>
                order.side === orderSideForConditionalOrder &&
                isTakeProfitOrderNew(order, isSlTpLimitOrdersEnabled)
            ),
          };
        }
      );
    }
  );

export const getSubaccountPositionByUniqueId = () =>
  createAppSelector(
    [
      BonsaiCore.account.parentSubaccountPositions.data,
      (s, uniqueId: PositionUniqueId) => uniqueId,
    ],
    (positions, uniqueId) => {
      return positions?.find((p) => p.uniqueId === uniqueId);
    }
  );

/**
 * @param orderId
 * @returns order details with the given orderId
 */
export const getOrderDetails = () =>
  createAppSelector(
    [
      BonsaiCore.account.orderHistory.data,
      BonsaiCore.account.openOrders.data,
      BonsaiCore.markets.markets.data,
      (s, orderId: string) => orderId,
    ],
    (historical, current, marketSummaries, orderId) => {
      const matchingOrder = [...historical, ...current].find((order) => order.id === orderId);
      return matchingOrder
        ? getHydratedOrder({
            data: matchingOrder,
            marketSummaries: marketSummaries ?? {},
          })
        : undefined;
    }
  );

/**
 * @param state
 * @returns list of fills for the currently connected subaccount
 */
export const getSubaccountFills = BonsaiCore.account.fills.data;

/**
 * @param state
 * @returns Record of SubaccountFills indexed by marketId
 */
export const getMarketFills = createAppSelector(
  [getSubaccountFills],
  (fills): { [marketId: string]: SubaccountFill[] } => {
    return groupBy(fills, (f) => f.market);
  }
);

/**
 * @param state
 * @returns fill details with the given fillId
 */
export const getFillDetails = () =>
  createAppSelector(
    [BonsaiCore.account.fills.data, BonsaiCore.markets.markets.data, (s, fillId: string) => fillId],
    (fills, marketSummaries, fillId) => {
      const matchingFill = fills.find((fill) => fill.id === fillId);
      return matchingFill
        ? getHydratedFill({
            data: matchingFill,
            marketSummaries: marketSummaries ?? {},
          })
        : undefined;
    }
  );

const getFillsForOrderId = () =>
  createAppSelector([(s, orderId) => orderId, getSubaccountFills], (orderId, fills) =>
    orderId ? groupBy(fills, 'orderId')[orderId] ?? [] : []
  );

/**
 * @returns the average price the order is filled at
 */
export const getAverageFillPriceForOrder = () =>
  createAppSelector([getFillsForOrderId()], getAverageFillPrice);

/**
 * @param state
 * @returns user's OnboardingState
 */
export const getOnboardingState = (state: RootState) => state.account.onboardingState;

/**
 * @param state
 * @returns whether an account is connected
 */
export const getIsAccountConnected = (state: RootState) =>
  getOnboardingState(state) === OnboardingState.AccountConnected;

/**
 * @param state
 * @returns OnboardingGuards (Record of boolean items) to aid in determining what Onboarding Step the user is on.
 */
export const getOnboardingGuards = (state: RootState) => state.account.onboardingGuards;

/**
 * @returns compliance status of the current session
 */
export const getComplianceStatus = createAppSelector(
  [BonsaiCore.compliance.data],
  (compliance) => compliance.status
);

/**
 * @returns compliance status of the current session
 */
export const getComplianceUpdatedAt = createAppSelector(
  [BonsaiCore.compliance.data],
  (compliance) => compliance.updatedAt
);

/**
 * @returns compliance geo of the current session
 */
export const getGeo = createAppSelector(
  [BonsaiCore.compliance.data],
  (compliance) => compliance.geo
);

export const getAccountUiMemory = (state: RootState) => state.accountUiMemory;
export const getCurrentAccountMemory = createAppSelector(
  [getSelectedNetwork, getUserWalletAddress, getAccountUiMemory],
  (networkId, walletId, memory) => memory[walletId ?? '']?.[networkId]
);

export const createGetOpenOrdersCount = () =>
  createAppSelector(
    [BonsaiCore.account.openOrders.data, (state, market: string | undefined) => market],
    (orders, market) => {
      const ourOrders = market == null ? orders : orders.filter((o) => o.marketId === market);

      return ourOrders.length;
    }
  );

export const createGetUnseenOpenOrdersCount = () =>
  createAppSelector(
    [
      getCurrentAccountMemory,
      BonsaiCore.network.indexerHeight.data,
      BonsaiCore.account.openOrders.data,
      (state, market: string | undefined) => market,
    ],
    (memory, height, orders, market) => {
      if (height == null) {
        return 0;
      }
      const ourOrders = market == null ? orders : orders.filter((o) => o.marketId === market);
      if (ourOrders.length === 0) {
        return 0;
      }
      if (memory == null) {
        return ourOrders.length;
      }
      const unseen = ourOrders.filter(
        (o) =>
          (o.updatedAtMilliseconds ?? 0) >
          (mapIfPresent(
            (memory.seenOpenOrders[o.marketId] ?? memory.seenOpenOrders[ALL_MARKETS_STRING])?.time,
            (t) => new Date(t).getTime()
          ) ?? 0)
      );
      return unseen.length;
    }
  );

export const createGetUnseenOrderHistoryCount = () =>
  createAppSelector(
    [
      getCurrentAccountMemory,
      BonsaiCore.network.indexerHeight.data,
      BonsaiCore.account.orderHistory.data,
      (state, market: string | undefined) => market,
    ],
    (memory, height, orders, market) => {
      if (height == null) {
        return 0;
      }
      const ourOrders = market == null ? orders : orders.filter((o) => o.marketId === market);
      if (ourOrders.length === 0) {
        return 0;
      }
      if (memory == null) {
        return ourOrders.length;
      }
      const unseen = ourOrders.filter(
        (o) =>
          (o.updatedAtMilliseconds ?? 0) >
          (mapIfPresent(
            (memory.seenOrderHistory[o.marketId] ?? memory.seenOrderHistory[ALL_MARKETS_STRING])
              ?.time,
            (t) => new Date(t).getTime()
          ) ?? 0)
      );
      return unseen.length;
    }
  );

export const createGetUnseenFillsCount = () =>
  createAppSelector(
    [
      getCurrentAccountMemory,
      BonsaiCore.network.indexerHeight.data,
      BonsaiCore.account.fills.data,
      (state, market: string | undefined) => market,
    ],
    (memory, height, fills, market) => {
      if (height == null) {
        return 0;
      }
      const ourFills = market == null ? fills : fills.filter((o) => o.market === market);
      if (ourFills.length === 0) {
        return 0;
      }
      if (memory == null) {
        return ourFills.length;
      }
      const unseen = ourFills.filter(
        (o) =>
          (mapIfPresent(o.createdAt, (c) => new Date(c).getTime()) ?? 0) >
          (mapIfPresent(
            (memory.seenFills[o.market ?? ''] ?? memory.seenFills[ALL_MARKETS_STRING])?.time,
            (t) => new Date(t).getTime()
          ) ?? 0)
      );
      return unseen.length;
    }
  );
