import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { Subaccount, type Nullable, type TradingRewards } from '@/constants/abacus';
import { OnboardingGuard, OnboardingState } from '@/constants/account';
import { LocalStorageKey } from '@/constants/localStorage';

import { getLocalStorage } from '@/lib/localStorage';

export type AccountState = {
  tradingRewards?: TradingRewards;

  subaccountForPostOrders?: Nullable<Subaccount>;

  onboardingGuards: Record<OnboardingGuard, boolean | undefined>;
  onboardingState: OnboardingState;
};

const initialState: AccountState = {
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
};

export const accountSlice = createSlice({
  name: 'Account',
  initialState,
  reducers: {
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

    setSubaccountForPostOrders: (state, action: PayloadAction<Nullable<Subaccount>>) => {
      state.subaccountForPostOrders = action.payload;
    },
    clearSubaccountState: (state) => {
      state.subaccountForPostOrders = undefined;
    },
  },
});

export const {
  setOnboardingGuard,
  setOnboardingState,
  setSubaccountForPostOrders,
  clearSubaccountState,
} = accountSlice.actions;
