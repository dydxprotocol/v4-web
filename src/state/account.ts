import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
  SubaccountFill,
  Nullable,
  Subaccount,
  SubaccountFills,
  SubaccountFundingPayments,
  Wallet,
  SubaccountOrder,
  SubaccountTransfers,
  HistoricalPnlPeriods,
  SubAccountHistoricalPNLs,
} from '@/constants/abacus';

import { OnboardingGuard, OnboardingState } from '@/constants/account';
import { LocalStorageKey } from '@/constants/localStorage';
import { WalletType } from '@/constants/wallets';

import { getLocalStorage } from '@/lib/localStorage';

export type AccountState = {
  fills?: SubaccountFills;
  fundingPayments?: SubaccountFundingPayments;
  transfers?: SubaccountTransfers;
  clearedOrderIds?: string[];
  uncommittedOrderClientIds?: number[];
  hasUnseenFillUpdates: boolean;
  hasUnseenOrderUpdates: boolean;
  historicalPnl?: SubAccountHistoricalPNLs;
  isGeoBlocked?: boolean;
  onboardingGuards: Record<OnboardingGuard, boolean | undefined>;
  onboardingState: OnboardingState;
  subaccount?: Nullable<Subaccount>;
  wallet?: Nullable<Wallet>;
  walletType?: WalletType;
  historicalPnlPeriod?: HistoricalPnlPeriods;
};

const initialState: AccountState = {
  fills: undefined,
  fundingPayments: undefined,
  transfers: undefined,
  clearedOrderIds: undefined,
  uncommittedOrderClientIds: undefined,
  hasUnseenFillUpdates: false,
  hasUnseenOrderUpdates: false,
  historicalPnl: undefined,
  isGeoBlocked: false,
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
  subaccount: undefined,
  wallet: undefined,
  walletType: getLocalStorage<WalletType>({
    key: LocalStorageKey.OnboardingSelectedWalletType,
  }),
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
    setIsGeoBlocked: (state, action: PayloadAction<boolean>) => {
      state.isGeoBlocked = action.payload;
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
    addUncommittedOrderClientId: (state, action: PayloadAction<number>) => {
      state.uncommittedOrderClientIds = state.uncommittedOrderClientIds
        ? [...state.uncommittedOrderClientIds, action.payload]
        : [action.payload];
    },
    removeUncommittedOrderClientId: (state, action: PayloadAction<number>) => {
      state.uncommittedOrderClientIds = state.uncommittedOrderClientIds?.filter(
        (clientId) => clientId !== action.payload
      );
    },
    viewedFills: (state) => {
      state.hasUnseenFillUpdates = false;
    },
    viewedOrders: (state) => {
      state.hasUnseenOrderUpdates = false;
    },
  },
});

export const {
  setFills,
  setFundingPayments,
  setTransfers,
  clearOrder,
  setOnboardingGuard,
  setOnboardingState,
  setHistoricalPnl,
  setIsGeoBlocked,
  setSubaccount,
  setWallet,
  addUncommittedOrderClientId,
  removeUncommittedOrderClientId,
  viewedFills,
  viewedOrders,
} = accountSlice.actions;
