import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
  AccountBalance,
  Compliance,
  HistoricalPnlPeriods,
  Nullable,
  SubAccountHistoricalPNLs,
  Subaccount,
  SubaccountFill,
  SubaccountFills,
  SubaccountFundingPayments,
  SubaccountOrder,
  SubaccountTransfers,
  TradingRewards,
  UsageRestriction,
  Wallet,
} from '@/constants/abacus';
import { OnboardingGuard, OnboardingState } from '@/constants/account';
import { LocalStorageKey } from '@/constants/localStorage';
import { WalletType } from '@/constants/wallets';

import { getLocalStorage } from '@/lib/localStorage';

export type AccountState = {
  balances?: Record<string, AccountBalance>;
  stakingBalances?: Record<string, AccountBalance>;
  tradingRewards?: TradingRewards;
  wallet?: Nullable<Wallet>;
  walletType?: WalletType;

  subaccount?: Nullable<Subaccount>;
  fills?: SubaccountFills;
  fundingPayments?: SubaccountFundingPayments;
  transfers?: SubaccountTransfers;
  historicalPnl?: SubAccountHistoricalPNLs;

  onboardingGuards: Record<OnboardingGuard, boolean | undefined>;
  onboardingState: OnboardingState;

  clearedOrderIds?: string[];
  hasUnseenFillUpdates: boolean;
  hasUnseenOrderUpdates: boolean;
  latestOrder?: Nullable<SubaccountOrder>;
  historicalPnlPeriod?: HistoricalPnlPeriods;
  uncommittedOrderClientIds: number[];

  restriction?: Nullable<UsageRestriction>;
  compliance?: Compliance;
};

const initialState: AccountState = {
  // Wallet
  balances: undefined,
  wallet: undefined,
  walletType: getLocalStorage<WalletType>({
    key: LocalStorageKey.OnboardingSelectedWalletType,
  }),

  // Subaccount
  subaccount: undefined,
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
  hasUnseenFillUpdates: false,
  hasUnseenOrderUpdates: false,
  latestOrder: undefined,
  uncommittedOrderClientIds: [],
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

      return {
        ...state,
        fills: action.payload,
        hasUnseenFillUpdates: state.hasUnseenFillUpdates || hasNewFillUpdates,
      };
    },
    setFundingPayments: (state, action: PayloadAction<any>) => {
      state.fundingPayments = action.payload;
    },
    setTransfers: (state, action: PayloadAction<any>) => {
      state.transfers = action.payload;
    },
    setLatestOrder: (state, action: PayloadAction<Nullable<SubaccountOrder>>) => {
      const { clientId } = action.payload ?? {};
      state.latestOrder = action.payload;

      if (clientId) {
        state.uncommittedOrderClientIds = state.uncommittedOrderClientIds.filter(
          (id) => id !== clientId
        );
      }
    },
    clearOrder: (state, action: PayloadAction<string>) => ({
      ...state,
      clearedOrderIds: [...(state.clearedOrderIds || []), action.payload],
    }),
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
      const hasNewOrderUpdates =
        state.subaccount?.orders != null &&
        (action.payload?.orders?.toArray() ?? []).some(
          (order: SubaccountOrder) => !existingOrderIds.includes(order.id)
        );

      if (!state.hasUnseenOrderUpdates) {
        state.hasUnseenOrderUpdates = hasNewOrderUpdates;
      }

      state.subaccount = action.payload;
    },
    setWallet: (state, action: PayloadAction<Nullable<Wallet>>) => ({
      ...state,
      wallet: action.payload,
    }),
    viewedFills: (state) => {
      state.hasUnseenFillUpdates = false;
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
    setTradingRewards: (state, action: PayloadAction<TradingRewards>) => {
      state.tradingRewards = action.payload;
    },
    addUncommittedOrderClientId: (state, action: PayloadAction<number>) => {
      state.uncommittedOrderClientIds.push(action.payload);
    },
    removeUncommittedOrderClientId: (state, action: PayloadAction<number>) => {
      state.uncommittedOrderClientIds = state.uncommittedOrderClientIds.filter(
        (id) => id !== action.payload
      );
    },
  },
});

export const {
  setFills,
  setFundingPayments,
  setTransfers,
  setLatestOrder,
  clearOrder,
  setOnboardingGuard,
  setOnboardingState,
  setHistoricalPnl,
  setRestrictionType,
  setCompliance,
  setSubaccount,
  setWallet,
  viewedFills,
  viewedOrders,
  setBalances,
  setStakingBalances,
  setTradingRewards,
  addUncommittedOrderClientId,
  removeUncommittedOrderClientId,
} = accountSlice.actions;
