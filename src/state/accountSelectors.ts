import { isParentSubaccount } from '@/bonsai/lib/subaccountUtils';
import { BonsaiCore, BonsaiHelpers } from '@/bonsai/ontology';
import {
  OrderFlags,
  OrderStatus,
  PositionUniqueId,
  SubaccountFill,
  SubaccountOrder,
} from '@/bonsai/types/summaryTypes';
import BigNumber from 'bignumber.js';
import { groupBy, keyBy, mapValues } from 'lodash';

import {
  AMOUNT_RESERVED_FOR_GAS_USDC,
  AMOUNT_USDC_BEFORE_REBALANCE,
  OnboardingState,
} from '@/constants/account';
import { EMPTY_ARR } from '@/constants/objects';
import { USDC_DECIMALS } from '@/constants/tokens';
import { PlaceOrderStatuses } from '@/constants/trade';
import {
  IndexerOrderSide,
  IndexerPerpetualPositionStatus,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';

import { calc, mapIfPresent } from '@/lib/do';
import { BIG_NUMBERS, MaybeBigNumber, MustBigNumber } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';
import {
  getAverageFillPrice,
  getHydratedFill,
  getHydratedOrder,
  isStopLossOrderNew,
  isTakeProfitOrderNew,
} from '@/lib/orders';
import { isPresent } from '@/lib/typeUtils';

import { type RootState } from './_store';
import { getUserWalletAddress } from './accountInfoSelectors';
import { ALL_MARKETS_STRING } from './accountUiMemory';
import { getSelectedNetwork } from './appSelectors';
import { createAppSelector } from './appTypes';
import { getCurrentMarketId } from './currentMarketSelectors';
import { getLocalPlaceOrders } from './localOrdersSelectors';
import { selectHasNonExpiredPendingWithdraws } from './transfersSelectors';

/**
 * @param state
 * @returns Bonsai subaccount object
 */
export const getSubaccount = BonsaiCore.account.parentSubaccountSummary.data;

export const getSubaccountEquity = createAppSelector([getSubaccount], (s) => s?.equity.toNumber());

export const getSubaccountFreeCollateral = createAppSelector([getSubaccount], (s) =>
  s?.freeCollateral.toNumber()
);

/**
 * @param state
 * @returns list of a subaccount's open positions. Each item in the list is an open position in a different market.
 */
export const getOpenPositions = BonsaiCore.account.parentSubaccountPositions.data;

/**
 * @param state
 * @returns list of fills for the currently connected subaccount
 */
export const getSubaccountFills = BonsaiCore.account.fills.data;

/**
 *
 * @returns All SubaccountOrders that have a margin mode of Isolated and no existing position for the market.
 */
export const getNonZeroPendingPositions = createAppSelector(
  [BonsaiHelpers.unopenedIsolatedPositions],
  (pending) => pending?.filter((p) => p.equity.toNumber() > 0)
);

export const getOpenPositionFromId = createAppSelector(
  [getOpenPositions, (s, positionId: PositionUniqueId) => positionId],
  (allOpenPositions, positionId) =>
    allOpenPositions?.find(({ uniqueId }) => uniqueId === positionId)
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

/**
 * @param state
 * @returns list of orders that have not been filled or cancelled
 */
export const getSubaccountOpenOrders = BonsaiCore.account.openOrders.data;

/**
 * @param state
 * @returns order with the specified id
 */
export const getOrderById = createAppSelector(
  [getSubaccountOrders, (s, orderId: string) => orderId],
  (orders, orderId) => orders.find((order) => order.id === orderId)
);

/**
 * @param state
 * @returns order with the specified client id
 */
export const getOrderByClientId = createAppSelector(
  [getSubaccountOrders, (s, orderClientId: string) => orderClientId],
  (orders, orderClientId) => orders.find((order) => order.clientId === orderClientId)
);

/**
 * @param state
 * @returns list of conditional orders that have not been filled or cancelled for all subaccount positions
 */
export const getSubaccountConditionalOrders = createAppSelector(
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
          position.side === IndexerPositionSide.LONG ? IndexerOrderSide.SELL : IndexerOrderSide.BUY;

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

export const getSubaccountPositionByUniqueId = createAppSelector(
  [BonsaiCore.account.parentSubaccountPositions.data, (s, uniqueId: PositionUniqueId) => uniqueId],
  (positions, uniqueId) => {
    return positions?.find((p) => p.uniqueId === uniqueId);
  }
);

/**
 * @param orderId
 * @returns order details with the given orderId
 */
export const getOrderDetails = createAppSelector(
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
export const getFillDetails = createAppSelector(
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

export const getFillsForOrderId = createAppSelector(
  [(s, orderId: string | undefined) => orderId, getSubaccountFills],
  (orderId, fills) => (orderId ? fills.filter((f) => f.orderId === orderId) : [])
);

/**
 * @returns the average price the order is filled at
 */
export const getAverageFillPriceForOrder = createAppSelector(
  [getFillsForOrderId],
  getAverageFillPrice
);

/**
 * @param state
 * @returns user's OnboardingState
 */
export const getOnboardingState = (state: RootState) => state.account.onboardingState;

/**
 * @returns whether to display the choose wallet step in the onboarding flow
 */
export const getDisplayChooseWallet = (state: RootState) => state.account.displayChooseWallet;

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

export const createGetOpenOrdersCount = createAppSelector(
  [BonsaiCore.account.openOrders.data, (state, market: string | undefined) => market],
  (orders, market) => {
    const ourOrders = market == null ? orders : orders.filter((o) => o.marketId === market);

    return ourOrders.length;
  }
);

export const createGetUnseenOpenOrdersCount = createAppSelector(
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

export const createGetUnseenOrderHistoryCount = createAppSelector(
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

export const createGetUnseenFillsCount = createAppSelector(
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

export const selectReclaimableChildSubaccountFunds = createAppSelector(
  [
    BonsaiCore.account.childSubaccountSummaries.data,
    BonsaiCore.account.parentSubaccountPositions.data,
    BonsaiCore.account.openOrders.data,
    getLocalPlaceOrders,
    BonsaiCore.account.openOrders.loading,
  ],
  (
    childSubaccountSummaries,
    parentSubaccountPositions,
    openOrders,
    localPlaceOrders,
    ordersLoading
  ) => {
    if (childSubaccountSummaries == null || parentSubaccountPositions == null) {
      return undefined;
    }

    const openPositions = parentSubaccountPositions.filter(
      (position) =>
        !isParentSubaccount(position.subaccountNumber) &&
        position.status === IndexerPerpetualPositionStatus.OPEN
    );

    const groupedPositions = groupBy(openPositions, (p) => p.subaccountNumber);
    const groupedOrders = groupBy(openOrders, (o) => o.subaccountNumber);

    const summaries = objectEntries(childSubaccountSummaries)
      .map(([subaccountNumberStr, summary]) => {
        const subaccountNumber = parseInt(subaccountNumberStr, 10);
        if (isParentSubaccount(subaccountNumber) || groupedPositions[subaccountNumber] != null) {
          return undefined;
        }

        return {
          subaccountNumber,
          equity: summary.equity ?? BIG_NUMBERS.ZERO,
        };
      })
      .filter(isPresent);

    const reclaimableChildSubaccounts: Array<{
      subaccountNumber: number;
      usdcBalance: BigNumber;
    }> = summaries
      .map(({ subaccountNumber, equity }) => {
        const hasUsdc = equity.gt(0);
        const hasNoOrders = (groupedOrders[subaccountNumber]?.length ?? 0) === 0;

        const hasLocalPlaceOrders = Object.values(localPlaceOrders).some(
          ({ cachedData, submissionStatus }) =>
            cachedData.subaccountNumber === subaccountNumber &&
            submissionStatus === PlaceOrderStatuses.Submitted
        );

        if (!hasUsdc || !hasNoOrders || hasLocalPlaceOrders || ordersLoading !== 'success') {
          return undefined;
        }

        return {
          subaccountNumber,
          usdcBalance: equity,
        };
      })
      .filter(isPresent);

    return reclaimableChildSubaccounts;
  }
);

export const selectOrphanedTriggerOrders = createAppSelector(
  [
    BonsaiCore.account.openOrders.data,
    BonsaiCore.account.parentSubaccountPositions.data,
    BonsaiCore.account.openOrders.loading,
    BonsaiCore.account.parentSubaccountPositions.loading,
  ],
  (openOrders, openPositions, ordersLoading, positionsLoading) => {
    if (openOrders.length === 0) {
      return undefined;
    }

    const ordersToCancel = calc(() => {
      if (ordersLoading !== 'success' || positionsLoading !== 'success') {
        return [];
      }
      const groupedPositions = keyBy(openPositions, (o) => o.uniqueId);

      const filteredOrders = openOrders.filter((o) => {
        const isConditionalOrder = o.orderFlags === OrderFlags.CONDITIONAL;
        const isReduceOnly = o.reduceOnly;
        const isActiveOrder = o.status === OrderStatus.Open || o.status === OrderStatus.Untriggered;
        return isConditionalOrder && isReduceOnly && isActiveOrder;
      });

      // Add orders to cancel if they are orphaned, or if the reduce-only order would increase the position
      const cancelOrders = filteredOrders.filter((o) => {
        const position = groupedPositions[o.positionUniqueId];
        const isOrphan = position == null;
        const hasInvalidReduceOnlyOrder =
          (position?.side === IndexerPositionSide.LONG && o.side === IndexerOrderSide.BUY) ||
          (position?.side === IndexerPositionSide.SHORT && o.side === IndexerOrderSide.SELL);

        return isOrphan || hasInvalidReduceOnlyOrder;
      });

      return cancelOrders;
    });

    return ordersToCancel;
  }
);

export const selectShouldAccountRebalanceUsdc = createAppSelector(
  [
    BonsaiCore.account.balances.data,
    BonsaiCore.account.childSubaccountSummaries.data,
    selectHasNonExpiredPendingWithdraws,
  ],
  (balances, childSubaccountSummaries, hasNonExpiredPendingWithdraws) => {
    if (childSubaccountSummaries == null) {
      return undefined;
    }

    const usdcBalance = balances.usdcAmount;
    const usdcBalanceBN: BigNumber | undefined = MaybeBigNumber(usdcBalance);

    if (usdcBalanceBN != null && usdcBalanceBN.gte(0)) {
      const shouldDeposit = usdcBalanceBN.gt(AMOUNT_RESERVED_FOR_GAS_USDC);
      const shouldWithdraw = usdcBalanceBN.lte(AMOUNT_USDC_BEFORE_REBALANCE);

      if (shouldDeposit && !shouldWithdraw && !hasNonExpiredPendingWithdraws) {
        const amountToDeposit = usdcBalanceBN
          .minus(AMOUNT_RESERVED_FOR_GAS_USDC)
          .toFixed(USDC_DECIMALS);

        return {
          requiredAction: 'deposit' as const,
          amountToDeposit,
          usdcBalance,
          targetAmount: AMOUNT_RESERVED_FOR_GAS_USDC,
        };
      }

      if (shouldWithdraw) {
        const amountToWithdraw = MustBigNumber(AMOUNT_RESERVED_FOR_GAS_USDC)
          .minus(usdcBalanceBN)
          .toFixed(USDC_DECIMALS);

        const maybeSubaccountNumber = objectEntries(childSubaccountSummaries).find(
          ([_, summary]) => {
            return summary.freeCollateral.gt(amountToWithdraw);
          }
        )?.[0];

        if (maybeSubaccountNumber == null) {
          return undefined;
        }

        const subaccountNumber = Number(maybeSubaccountNumber);

        return {
          requiredAction: 'withdraw' as const,
          amountToWithdraw,
          fromSubaccountNumber: subaccountNumber,
          usdcBalance,
          targetAmount: AMOUNT_RESERVED_FOR_GAS_USDC,
        };
      }
    }

    return undefined;
  }
);
