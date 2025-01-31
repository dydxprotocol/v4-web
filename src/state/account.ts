import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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
  type SubaccountOrder,
  type TradingRewards,
  type UnbondingDelegation,
  type UsageRestriction,
} from '@/constants/abacus';
import { OnboardingGuard, OnboardingState } from '@/constants/account';
import { LocalStorageKey } from '@/constants/localStorage';

import { getLocalStorage } from '@/lib/localStorage';
import { isOrderStatusClearable } from '@/lib/orders';

export type AccountState = {
  stakingBalances?: Record<string, AccountBalance>;
  stakingDelegations?: StakingDelegation[];
  unbondingDelegations?: UnbondingDelegation[];
  stakingRewards?: StakingRewards;
  tradingRewards?: TradingRewards;

  subaccount?: Nullable<Subaccount>;
  fills?: SubaccountFills;
  historicalPnl?: SubAccountHistoricalPNLs;

  onboardingGuards: Record<OnboardingGuard, boolean | undefined>;
  onboardingState: OnboardingState;
  clearedOrderIds?: string[];
  unseenFillsCountPerMarket: Record<string, number>;
  hasUnseenOrderUpdates: boolean;
  historicalPnlPeriod?: HistoricalPnlPeriods;

  restriction?: Nullable<UsageRestriction>;
  compliance?: Compliance;
};

const initialState: AccountState = {
  // Subaccount
  subaccount: undefined,
  fills: undefined,
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

  historicalPnlPeriod: undefined,

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

      return {
        ...state,
        fills: action.payload,
        unseenFillsCountPerMarket: newUnseenFillsCountPerMarket,
      };
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

      return {
        ...state,
        hasUnseenOrderUpdates: hasNewOrderUpdates,
        subaccount: action.payload,
      };
    },
    viewedFills: (state, action: PayloadAction<string | undefined>) => {
      if (!action.payload) {
        // viewed fills for all markets
        state.unseenFillsCountPerMarket = {};
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [action.payload]: unseenCount, ...remaining } = state.unseenFillsCountPerMarket;
        state.unseenFillsCountPerMarket = remaining;
      }
    },
    viewedOrders: (state) => {
      state.hasUnseenOrderUpdates = false;
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
    clearSubaccountState: (state) => {
      state.subaccount = undefined;
      state.fills = undefined;
      state.historicalPnl = undefined;
    },
  },
});

export const {
  setFills,

  clearOrder,
  clearAllOrders,
  setOnboardingGuard,
  setOnboardingState,
  setHistoricalPnl,
  setRestrictionType,
  setCompliance,
  setSubaccount,
  viewedFills,
  viewedOrders,
  setStakingBalances,
  setStakingDelegations,
  setTradingRewards,
  setUnbondingDelegations,
  setStakingRewards,

  clearSubaccountState,
} = accountSlice.actions;
