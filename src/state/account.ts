import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { OnboardingGuard, OnboardingState } from '@/constants/account';
import { LocalStorageKey } from '@/constants/localStorage';

import { getLocalStorage } from '@/lib/localStorage';

export type AccountState = {
  onboardingGuards: Record<OnboardingGuard, boolean | undefined>;
  onboardingState: OnboardingState;
  onboardedThisSession: boolean;
  displayChooseWallet: boolean;
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
  onboardedThisSession: false,
  displayChooseWallet: false,
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
    setOnboardedThisSession: (state, action: PayloadAction<boolean>) => ({
      ...state,
      onboardedThisSession: action.payload,
    }),
    setDisplayChooseWallet: (state, action: PayloadAction<boolean>) => ({
      ...state,
      displayChooseWallet: action.payload,
    }),
  },
});

export const {
  setOnboardingGuard,
  setOnboardingState,
  setOnboardedThisSession,
  setDisplayChooseWallet,
} = accountSlice.actions;
