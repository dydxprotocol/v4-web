import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';

import {
  type AccountBalance,
  type Compliance,
  type HistoricalPnlPeriods,
  type Nullable,
  type StakingDelegation,
  type StakingRewards,
  type SubAccountHistoricalPNLs,
  type Subaccount,
  type SubaccountFill,
  type SubaccountFills,
  type SubaccountFundingPayments,
  type SubaccountOrder,
  type SubaccountTransfers,
  type TradingRewards,
  type UnbondingDelegation,
  type UsageRestriction,
  type Wallet,
} from '@/constants/abacus';
import { OnboardingGuard, OnboardingState } from '@/constants/account';
import { DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS, ErrorParams } from '@/constants/errors';
import { LocalStorageKey } from '@/constants/localStorage';
import {
  CANCEL_ALL_ORDERS_KEY,
  CancelOrderStatuses,
  LocalCancelAllData,
  PlaceOrderStatuses,
  type LocalCancelOrderData,
  type LocalPlaceOrderData,
  type TradeTypes,
} from '@/constants/trade';

import { getLocalStorage } from '@/lib/localStorage';
import { isOrderStatusCanceled, isOrderStatusClearable } from '@/lib/orders';

export type AccountState = {
  balances?: Record<string, AccountBalance>;
  stakingBalances?: Record<string, AccountBalance>;
  stakingDelegations?: StakingDelegation[];
  unbondingDelegations?: UnbondingDelegation[];
  stakingRewards?: StakingRewards;
  tradingRewards?: TradingRewards;
  wallet?: Nullable<Wallet>;

  subaccount?: Nullable<Subaccount>;
  fills?: SubaccountFills;
  fundingPayments?: SubaccountFundingPayments;
  transfers?: SubaccountTransfers;
  historicalPnl?: SubAccountHistoricalPNLs;

  childSubaccounts: {
    [subaccountNumber: number]: Nullable<
      Partial<
        Subaccount & {
          fills: SubaccountFills;
          fundingPayments: SubaccountFundingPayments;
          transfers: SubaccountTransfers;
          historicalPnl: SubAccountHistoricalPNLs;
        }
      >
    >;
  };

  onboardingGuards: Record<OnboardingGuard, boolean | undefined>;
  onboardingState: OnboardingState;

  clearedOrderIds?: string[];
  unseenFillsCountPerMarket: Record<string, number>;
  hasUnseenOrderUpdates: boolean;
  latestOrder?: Nullable<SubaccountOrder>;
  historicalPnlPeriod?: HistoricalPnlPeriods;
  uncommittedOrderClientIds: string[];
  localPlaceOrders: LocalPlaceOrderData[];
  localCancelOrders: LocalCancelOrderData[];
  localCancelAlls: Record<string, LocalCancelAllData>;

  restriction?: Nullable<UsageRestriction>;
  compliance?: Compliance;
};

const initialState: AccountState = {
  // Wallet
  balances: undefined,
  wallet: undefined,

  // Subaccount
  subaccount: undefined,
  childSubaccounts: {},
  fills: undefined,
  fundingPayments: undefined,
  transfers: undefined,
  historicalPnl: undefined,

  // Onboarding
  onboardingGuards: {
    [OnboardingGuard.hasAcknowledgedTerms]: Boolean(
      getLocalStorage<boolean>({
        key: LocalStorageKey.OnboardingHasAcknowledgedTerms,
        defaultValue: false,
      })
    ),
    [OnboardingGuard.hasPreviousTransactions]: undefined,
  },
  onboardingState: OnboardingState.Disconnected,

  // UI
  clearedOrderIds: undefined,
  unseenFillsCountPerMarket: {},
  hasUnseenOrderUpdates: false,
  latestOrder: undefined,
  uncommittedOrderClientIds: [],
  historicalPnlPeriod: undefined,
  localPlaceOrders: [],
  localCancelOrders: [],
  localCancelAlls: {},

  // Restriction
  restriction: undefined,
  compliance: undefined,
};

export const accountSlice = createSlice({
  name: 'Account',
  initialState,
  reducers: {
    setFills: (state, action: PayloadAction<any>) => {
      const existingFillIds = state.fills ? [...state.fills.map((fill) => fill.id)] : [];

      // Updates are only considered new after state.fills has been set
      const hasNewFillUpdates: boolean =
        state.fills != null &&
        (action.payload ?? []).some((fill: SubaccountFill) => !existingFillIds.includes(fill.id));

      const newUnseenFillsCountPerMarket = { ...state.unseenFillsCountPerMarket };
      if (hasNewFillUpdates) {
        (action.payload ?? [])
          .filter((fill: SubaccountFill) => !existingFillIds.includes(fill.id))
          .forEach((fill: SubaccountFill) => {
            newUnseenFillsCountPerMarket[fill.marketId] =
              (newUnseenFillsCountPerMarket[fill.marketId] ?? 0) + 1;
          });
      }

      const filledOrderIds = (action.payload ?? []).map((fill: SubaccountFill) => fill.orderId);

      return {
        ...state,
        fills: action.payload,
        unseenFillsCountPerMarket: newUnseenFillsCountPerMarket,
        localPlaceOrders: hasNewFillUpdates
          ? state.localPlaceOrders.map((order) =>
              order.submissionStatus < PlaceOrderStatuses.Filled &&
              order.orderId &&
              filledOrderIds.includes(order.orderId)
                ? {
                    ...order,
                    submissionStatus: PlaceOrderStatuses.Filled,
                  }
                : order
            )
          : state.localPlaceOrders,
        localCancelOrders: hasNewFillUpdates
          ? state.localCancelOrders.filter((order) => !filledOrderIds.includes(order.orderId))
          : state.localCancelOrders,
      };
    },
    setFundingPayments: (state, action: PayloadAction<any>) => {
      state.fundingPayments = action.payload;
    },
    setTransfers: (state, action: PayloadAction<any>) => {
      state.transfers = action.payload;
    },
    setLatestOrder: (state, action: PayloadAction<Nullable<SubaccountOrder>>) => {
      const { clientId, id } = action.payload ?? {};
      state.latestOrder = action.payload;

      if (clientId) {
        state.uncommittedOrderClientIds = state.uncommittedOrderClientIds.filter(
          (uncommittedClientId) => uncommittedClientId !== clientId
        );
        state.localPlaceOrders = state.localPlaceOrders.map((order) =>
          order.clientId === clientId && order.submissionStatus < PlaceOrderStatuses.Placed
            ? {
                ...order,
                orderId: id,
                submissionStatus: PlaceOrderStatuses.Placed,
              }
            : order
        );
      }
    },
    clearOrder: (state, action: PayloadAction<string>) => ({
      ...state,
      clearedOrderIds: [...(state.clearedOrderIds ?? []), action.payload],
    }),
    clearAllOrders: (state, action: PayloadAction<string | undefined>) => {
      const marketId = action.payload;
      const clearableOrderIds =
        state.subaccount?.orders
          ?.toArray()
          .filter(
            (order) =>
              (!marketId || order.marketId === marketId) && isOrderStatusClearable(order.status)
          )
          .map((order) => order.id) ?? [];
      return {
        ...state,
        clearedOrderIds: [...(state.clearedOrderIds ?? []), ...clearableOrderIds],
      };
    },
    setOnboardingGuard: (
      state,
      action: PayloadAction<{ guard: OnboardingGuard; value: boolean }>
    ) => ({
      ...state,
      onboardingGuards: {
        ...state.onboardingGuards,
        [action.payload.guard]: action.payload.value,
      },
    }),
    setOnboardingState: (state, action: PayloadAction<OnboardingState>) => ({
      ...state,
      onboardingState: action.payload,
    }),
    setHistoricalPnl: (state, action: PayloadAction<Nullable<SubAccountHistoricalPNLs>>) => {
      if (action.payload) {
        state.historicalPnl = action.payload;
      }
    },
    setRestrictionType: (state, action: PayloadAction<Nullable<UsageRestriction>>) => {
      state.restriction = action.payload;
    },
    setCompliance: (state, action: PayloadAction<Compliance>) => {
      state.compliance = action.payload;
    },
    setSubaccount: (state, action: PayloadAction<Nullable<Subaccount>>) => {
      const existingOrderIds = state.subaccount?.orders
        ? state.subaccount.orders.toArray().map((order) => order.id)
        : [];

      // Updates are only considered new after state.subaccount.orders has been set
      const payloadOrders = action.payload?.orders?.toArray() ?? [];
      const hasNewOrderUpdates =
        state.subaccount?.orders != null &&
        payloadOrders.some((order: SubaccountOrder) => !existingOrderIds.includes(order.id));

      const canceledOrderIdsInPayload = payloadOrders
        .filter((order) => isOrderStatusCanceled(order.status))
        .map((order) => order.id);

      // ignore locally canceled orders since it's intentional and already handled
      // by local cancel tracking and notification
      const isOrderCanceledByBackend = (orderId: string) =>
        canceledOrderIdsInPayload.includes(orderId) &&
        !state.localCancelOrders.map((order) => order.orderId).includes(orderId);

      const getNewCanceledOrderIds = (batch: LocalCancelAllData) => {
        const newCanceledOrderIds = _.intersection(batch.orderIds, canceledOrderIdsInPayload);
        return _.uniq([...(batch.canceledOrderIds ?? []), ...newCanceledOrderIds]);
      };

      const cancelUpdates = canceledOrderIdsInPayload.length
        ? {
            localPlaceOrders: state.localPlaceOrders.map((order) =>
              order.orderId &&
              canceledOrderIdsInPayload.includes(order.orderId) &&
              isOrderCanceledByBackend(order.orderId)
                ? {
                    ...order,
                    submissionStatus: PlaceOrderStatuses.Canceled,
                  }
                : order
            ),
            localCancelOrders: state.localCancelOrders.map((order) =>
              canceledOrderIdsInPayload.includes(order.orderId)
                ? { ...order, submissionStatus: CancelOrderStatuses.Canceled }
                : order
            ),
            localCancelAlls: Object.fromEntries(
              Object.entries(state.localCancelAlls).map(([marketId, batch]) => [
                marketId,
                {
                  ...batch,
                  canceledOrderIds: getNewCanceledOrderIds(batch),
                },
              ])
            ),
          }
        : {};

      return {
        ...state,
        subaccount: action.payload,
        hasUnseenOrderUpdates: hasNewOrderUpdates,
        ...cancelUpdates,
      };
    },
    setChildSubaccount: (
      state,
      action: PayloadAction<Partial<AccountState['childSubaccounts']>>
    ) => {
      const childSubaccountsCopy = { ...state.childSubaccounts };

      Object.keys(action.payload).forEach((subaccountNumber) => {
        childSubaccountsCopy[Number(subaccountNumber)] = {
          ...childSubaccountsCopy[Number(subaccountNumber)],
          ...action.payload[Number(subaccountNumber)],
        };
      });

      state.childSubaccounts = childSubaccountsCopy;
    },
    setWallet: (state, action: PayloadAction<Nullable<Wallet>>) => ({
      ...state,
      wallet: action.payload,
    }),
    viewedFills: (state, action: PayloadAction<string | undefined>) => {
      if (!action.payload) {
        // viewed fills for all markets
        state.unseenFillsCountPerMarket = {};
      } else {
        const { [action.payload]: unseenCount, ...remaining } = state.unseenFillsCountPerMarket;
        state.unseenFillsCountPerMarket = remaining;
      }
    },
    viewedOrders: (state) => {
      state.hasUnseenOrderUpdates = false;
    },
    setBalances: (state, action: PayloadAction<Record<string, AccountBalance>>) => {
      state.balances = action.payload;
    },
    setStakingBalances: (state, action: PayloadAction<Record<string, AccountBalance>>) => {
      state.stakingBalances = action.payload;
    },
    setStakingDelegations: (state, action: PayloadAction<StakingDelegation[]>) => {
      state.stakingDelegations = action.payload;
    },
    setUnbondingDelegations: (state, action: PayloadAction<UnbondingDelegation[]>) => {
      state.unbondingDelegations = action.payload;
    },
    setStakingRewards: (state, action: PayloadAction<StakingRewards>) => {
      state.stakingRewards = action.payload;
    },
    setTradingRewards: (state, action: PayloadAction<TradingRewards>) => {
      state.tradingRewards = action.payload;
    },
    placeOrderSubmitted: (
      state,
      action: PayloadAction<{ marketId: string; clientId: string; orderType: TradeTypes }>
    ) => {
      state.localPlaceOrders.push({
        ...action.payload,
        submissionStatus: PlaceOrderStatuses.Submitted,
      });
      state.uncommittedOrderClientIds.push(action.payload.clientId);
    },
    placeOrderFailed: (
      state,
      action: PayloadAction<{ clientId: string; errorParams: ErrorParams }>
    ) => {
      state.localPlaceOrders = state.localPlaceOrders.map((order) =>
        order.clientId === action.payload.clientId
          ? {
              ...order,
              errorParams: action.payload.errorParams,
            }
          : order
      );
      state.uncommittedOrderClientIds = state.uncommittedOrderClientIds.filter(
        (id) => id !== action.payload.clientId
      );
    },
    placeOrderTimeout: (state, action: PayloadAction<string>) => {
      if (state.uncommittedOrderClientIds.includes(action.payload)) {
        placeOrderFailed({
          clientId: action.payload,
          errorParams: DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS,
        });
      }
    },
    cancelOrderSubmitted: (state, action: PayloadAction<string>) => {
      state.localCancelOrders.push({
        orderId: action.payload,
        submissionStatus: CancelOrderStatuses.Submitted,
      });
    },
    cancelOrderConfirmed: (state, action: PayloadAction<string>) => {
      state.localCancelOrders = state.localCancelOrders.map((order) =>
        order.orderId === action.payload
          ? { ...order, submissionStatus: CancelOrderStatuses.Canceled }
          : order
      );
    },
    cancelOrderFailed: (
      state,
      action: PayloadAction<{ orderId: string; errorParams: ErrorParams }>
    ) => {
      state.localCancelOrders = state.localCancelOrders.map((order) =>
        order.orderId === action.payload.orderId
          ? {
              ...order,
              errorParams: action.payload.errorParams,
            }
          : order
      );
    },
    cancelAllSubmitted: (
      state,
      action: PayloadAction<{ marketId?: string; orderIds: string[] }>
    ) => {
      const { marketId, orderIds } = action.payload;
      // when marketId is undefined, it means cancel all orders globally
      const cancelAllKey = marketId ?? CANCEL_ALL_ORDERS_KEY;

      state.localCancelAlls[cancelAllKey] = {
        key: cancelAllKey,
        orderIds,
      };

      state.localCancelOrders = [
        ...state.localCancelOrders,
        ...orderIds.map((orderId) => ({
          orderId,
          submissionStatus: CancelOrderStatuses.Submitted,
          isSubmittedThroughCancelAll: true, // track this to skip certain notifications
        })),
      ];
    },
    cancelAllOrderConfirmed: (state, action: PayloadAction<string>) => {
      const orderId = action.payload;
      const order = state.subaccount?.orders?.toArray()?.find((o) => o.id === orderId);
      if (!order) return;

      updateCancelAllOrderIds(state, orderId, 'canceledOrderIds', order.marketId);
      cancelOrderConfirmed(orderId);
    },
    cancelAllOrderFailed: (
      state,
      action: PayloadAction<{
        orderId: string;
        errorParams?: ErrorParams;
      }>
    ) => {
      const { orderId, errorParams } = action.payload;
      const order = state.subaccount?.orders?.toArray()?.find((o) => o.id === orderId);
      if (!order) return;

      updateCancelAllOrderIds(state, orderId, 'failedOrderIds', order.marketId);
      if (errorParams) cancelOrderFailed({ orderId, errorParams });
    },
  },
});

export const {
  setFills,
  setFundingPayments,
  setTransfers,
  setLatestOrder,
  clearOrder,
  clearAllOrders,
  setOnboardingGuard,
  setOnboardingState,
  setHistoricalPnl,
  setRestrictionType,
  setCompliance,
  setSubaccount,
  setChildSubaccount,
  setWallet,
  viewedFills,
  viewedOrders,
  setBalances,
  setStakingBalances,
  setStakingDelegations,
  setTradingRewards,
  setUnbondingDelegations,
  setStakingRewards,
  placeOrderSubmitted,
  placeOrderFailed,
  placeOrderTimeout,
  cancelOrderSubmitted,
  cancelOrderConfirmed,
  cancelOrderFailed,
  cancelAllSubmitted,
  cancelAllOrderConfirmed,
  cancelAllOrderFailed,
} = accountSlice.actions;

// helper functions
const updateCancelAllOrderIds = (
  state: AccountState,
  orderId: string,
  key: 'canceledOrderIds' | 'failedOrderIds',
  cancelAllKey: string
) => {
  const getNewOrderIds = (cancelAll: LocalCancelAllData) => {
    const existingOrderIds = cancelAll[key] ?? [];
    return cancelAll.orderIds.includes(orderId) && !existingOrderIds.includes(orderId)
      ? [...existingOrderIds, orderId]
      : existingOrderIds;
  };

  const updateKey = (currentKey: string) => ({
    ...state.localCancelAlls[currentKey],
    [key]: getNewOrderIds(state.localCancelAlls[currentKey]),
  });

  state.localCancelAlls = {
    ...state.localCancelAlls,
    ...(state.localCancelAlls[CANCEL_ALL_ORDERS_KEY] && {
      [CANCEL_ALL_ORDERS_KEY]: updateKey(CANCEL_ALL_ORDERS_KEY),
    }),
    ...(state.localCancelAlls[cancelAllKey] && {
      [cancelAllKey]: updateKey(cancelAllKey),
    }),
  };
};
