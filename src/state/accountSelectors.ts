import { OrderSide } from '@dydxprotocol/v4-client';
import { createSelector } from 'reselect';

import {
  type SubaccountOrder,
  type SubaccountFill,
  type SubaccountFundingPayment,
  AbacusOrderStatus,
  AbacusPositionSide,
  ORDER_SIDES,
} from '@/constants/abacus';

import { OnboardingState } from '@/constants/account';

import type { RootState } from './_store';

import { getHydratedTradingData } from '@/lib/orders';

import { getCurrentMarketId, getPerpetualMarkets } from './perpetualsSelectors';
import { getAssets } from './assetsSelectors';

/**
 * @param state
 * @returns Abacus' subaccount object
 */
export const getSubaccount = (state: RootState) => state.account.subaccount;

/**
 * @param state
 * @returns identifier of the current subaccount
 */
export const getSubaccountId = (state: RootState) => state.account.subaccount?.subaccountNumber;

/**
 * @param state
 * @returns buyingPower object of current subaccount
 */
export const getSubaccountBuyingPower = (state: RootState) => state.account.subaccount?.buyingPower;

/**
 * @param state
 * @returns equity object of current subaccount
 */
export const getSubaccountEquity = (state: RootState) => state.account.subaccount?.equity;

export const getSubaccountHistoricalPnl = (state: RootState) => state.account?.historicalPnl;

/**
 * @param state
 * @returns list of a subaccount's open positions. Each item in the list is an open position in a different market.
 */
export const getOpenPositions = (state: RootState) =>
  state.account.subaccount?.openPositions?.toArray();

/**
 * @param state
 * @returns list of a subaccount's open positions, excluding the ones in draft, i.e. with NONE position side.
 */
export const getExistingOpenPositions = createSelector([getOpenPositions], (allOpenPositions) =>
  allOpenPositions?.filter((position) => position.side.current !== AbacusPositionSide.NONE)
);

/**
 * @param state
 * @returns AccountPositions of the current market
 */
export const getCurrentMarketPositionData = (state: RootState) => {
  const currentMarketId = getCurrentMarketId(state);

  return Object.fromEntries(
    (getOpenPositions(state) ?? []).map((positionData) => [positionData.id, positionData])
  )[currentMarketId as string];
};

/**
 * @param state
 * @returns list of orders for the currently connected subaccount
 */
export const getSubaccountOrders = (state: RootState) =>
  state.account.subaccount?.orders?.toArray();

/**
 * @param state
 * @returns list of order ids that user has cleared and should be hidden
 */
export const getSubaccountClearedOrderIds = (state: RootState) => state.account.clearedOrderIds;

/**
 * @param state
 * @returns list of orders that user has not cleared and should be displayed
 */
export const getSubaccountUnclearedOrders = createSelector(
  [getSubaccountOrders, getSubaccountClearedOrderIds],
  (orders, clearedOrderIds) => orders?.filter((order) => !clearedOrderIds?.includes(order.id))
);

/**
 * @param state
 * @returns list of orders that are in the open status
 */
export const getSubaccountOpenOrders = createSelector([getSubaccountOrders], (orders) =>
  orders?.filter((order) => order.status === AbacusOrderStatus.open)
);

export const getSubaccountOpenOrdersBySideAndPrice = createSelector(
  [getSubaccountOpenOrders],
  (openOrders = []) => {
    const ordersBySide: Partial<Record<OrderSide, Record<number, SubaccountOrder>>> = {};
    for (const order of openOrders) {
      const side = ORDER_SIDES[order.side.name];
      const byPrice = (ordersBySide[side] ??= {});
      byPrice[order.price] = order;
    }
    return ordersBySide;
  }
);

/**
 * @param state
 * @returns order details with the given orderId
 */
export const getOrderDetails = (orderId: string) =>
  createSelector(
    [getSubaccountOrders, getAssets, getPerpetualMarkets],
    (orders, assets, perpetualMarkets) => {
      const order = orders?.find((order) => order.id === orderId);
      return order ? getHydratedTradingData({ data: order, assets, perpetualMarkets }) : undefined;
    }
  );

/**
 * @param state
 * @returns Record of SubaccountOrders indexed by marketId
 */
export const getMarketOrders = (state: RootState): { [marketId: string]: SubaccountOrder[] } => {
  const orders = getSubaccountUnclearedOrders(state);
  return (orders ?? []).reduce((marketOrders, order) => {
    marketOrders[order.marketId] ??= [];
    marketOrders[order.marketId].push(order);
    return marketOrders;
  }, {} as { [marketId: string]: SubaccountOrder[] });
};

/**
 * @param state
 * @returns SubaccountOrders of the current market
 */
export const getCurrentMarketOrders = createSelector(
  [getCurrentMarketId, getMarketOrders],
  (currentMarketId, marketOrders): SubaccountOrder[] =>
    !currentMarketId ? [] : marketOrders[currentMarketId]
);

/**
 * @param state
 * @returns list of fills for the currently connected subaccount
 */
export const getSubaccountFills = (state: RootState) => state.account?.fills;

/**
 * @param state
 * @returns Record of SubaccountFills indexed by marketId
 */
export const getMarketFills = (state: RootState): { [marketId: string]: SubaccountFill[] } => {
  const fills = getSubaccountFills(state);
  return (fills ?? []).reduce((marketFills, fill) => {
    marketFills[fill.marketId] ??= [];
    marketFills[fill.marketId].push(fill);
    return marketFills;
  }, {} as { [marketId: string]: SubaccountFill[] });
};

/**
 * @param state
 * @returns fill details with the given fillId
 */
export const getFillDetails = (fillId: string) =>
  createSelector(
    [getSubaccountFills, getAssets, getPerpetualMarkets],
    (fills, assets, perpetualMarkets) => {
      const fill = fills?.find((fill) => fill.id === fillId);
      return fill ? getHydratedTradingData({ data: fill, assets, perpetualMarkets }) : undefined;
    }
  );

/**
 * @param state
 * @returns SubaccountFills of the current market
 */
export const getCurrentMarketFills = createSelector(
  [getCurrentMarketId, getMarketFills],
  (currentMarketId, marketFills): SubaccountFill[] =>
    !currentMarketId ? [] : marketFills[currentMarketId]
);

/**
 * @param state
 * @returns list of funding payments for the currently connected subaccount
 */
export const getSubaccountFundingPayments = (state: RootState) => state.account?.fundingPayments;

/**
 * @param state
 * @returns Record of SubaccountFundingPayments indexed by marketId
 */
export const getMarketFundingPayments = (
  state: RootState
): { [marketId: string]: SubaccountFundingPayment[] } => {
  const fundingPayments = getSubaccountFundingPayments(state);
  return (fundingPayments ?? []).reduce((marketFundingPayments, fundingPayment) => {
    marketFundingPayments[fundingPayment.marketId] ??= [];
    marketFundingPayments[fundingPayment.marketId].push(fundingPayment);
    return marketFundingPayments;
  }, {} as { [marketId: string]: SubaccountFundingPayment[] });
};

/**
 * @param state
 * @returns SubaccountFundingPayments of the current market
 */
export const getCurrentMarketFundingPayments = createSelector(
  [getCurrentMarketId, getMarketFundingPayments],
  (currentMarketId, marketFundingPayments): SubaccountFundingPayment[] =>
    !currentMarketId ? [] : marketFundingPayments[currentMarketId]
);

/**
 * @param state
 * @returns Total numbers of the subaccount's open positions, open orders and fills
 */
export const getTradeInfoNumbers = createSelector(
  [getExistingOpenPositions, getSubaccountOrders, getSubaccountFills, getSubaccountFundingPayments],
  (positions, orders, fills, fundingPayments) => ({
    numTotalPositions: positions?.length,
    numTotalOpenOrders: orders?.filter((order) => order.status !== AbacusOrderStatus.cancelled)
      .length,
    numTotalFills: fills?.length,
    numTotalFundingPayments: fundingPayments?.length,
  })
);

/**
 * @param state
 * @returns Numbers of the subaccount's open orders and fills of the current market
 */
export const getCurrentMarketTradeInfoNumbers = createSelector(
  [getCurrentMarketOrders, getCurrentMarketFills, getCurrentMarketFundingPayments],
  (marketOrders, marketFills, marketFundingPayments) => {
    return {
      numOpenOrders: marketOrders?.filter((order) => order.status !== AbacusOrderStatus.cancelled)
        .length,
      numFills: marketFills?.length,
      numFundingPayments: marketFundingPayments?.length,
    };
  }
);

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
 * @param state
 * @returns a boolean indicating whether the user has uncommitted orders
 */
export const calculateHasUncommittedOrders = (state: RootState) => {
  return !!state.account.uncommittedOrderClientIds?.length;
};

/**
 * @param state
 * @returns List of uncommitted order clientIds
 */
export const getUncommittedOrderClientIds = (state: RootState) =>
  state.account.uncommittedOrderClientIds;

/**
 * @param state
 * @returns Whether there are unseen fill updates
 */
export const getHasUnseenFillUpdates = (state: RootState) => state.account.hasUnseenFillUpdates;

/**
 * @param state
 * @returns Whether there are unseen order updates
 */
export const getHasUnseenOrderUpdates = (state: RootState) => state.account.hasUnseenOrderUpdates;

/**
 * @returns Fee tier id of the current user
 */
export const getUserFeeTier = (state: RootState) => state.account?.wallet?.user?.feeTierId;

/**
 * @returns user stats of the current user
 */
export const getUserStats = (state: RootState) => ({
  makerVolume30D: state.account?.wallet?.user?.makerVolume30D,
  takerVolume30D: state.account?.wallet?.user?.takerVolume30D,
});
