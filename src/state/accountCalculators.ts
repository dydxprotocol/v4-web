import { createSelector } from 'reselect';

import {
  Nullable,
  RestrictionType,
  RestrictionTypes,
  SubaccountPosition,
} from '@/constants/abacus';
import { OnboardingState, OnboardingSteps } from '@/constants/account';
import { isDydxV4Network } from '@/constants/networks';

import {
  getExistingOpenPositions,
  getOnboardingGuards,
  getOnboardingState,
  getRestrictionType,
  getSubaccountId,
  getUncommittedOrderClientIds,
} from '@/state/accountSelectors';

import { getSelectedNetwork } from '@/state/appSelectors';

export const calculateOnboardingStep = createSelector(
  [getOnboardingState, getOnboardingGuards],
  (onboardingState: OnboardingState, onboardingGuards: ReturnType<typeof getOnboardingGuards>) => {
    const { hasAcknowledgedTerms, hasPreviousTransactions } = onboardingGuards;

    return {
      [OnboardingState.Disconnected]: OnboardingSteps.ChooseWallet,
      [OnboardingState.WalletConnected]: OnboardingSteps.KeyDerivation,
      [OnboardingState.AccountConnected]: !hasAcknowledgedTerms
        ? OnboardingSteps.AcknowledgeTerms
        : !hasPreviousTransactions
        ? OnboardingSteps.DepositFunds
        : undefined,
    }[onboardingState];
  }
);

/**
 * @description calculate whether an account is in a state where they can trade
 */
export const calculateCanAccountTrade = createSelector(
  [getOnboardingState, getSelectedNetwork],
  (onboardingState: OnboardingState, selectedNetwork: string) => {
    return onboardingState === OnboardingState.AccountConnected && isDydxV4Network(selectedNetwork);
  }
);

/**
 * @description calculate whether the client has enough information to display account info.
 * User does not have to have AccountConnected. The dYdX account can be viewed if the client knows the dYdX address.
 */
export const calculateCanViewAccount = createSelector(
  [getOnboardingState, getSubaccountId],
  (onboardingState: OnboardingState, subaccountId?: number) =>
    onboardingState === OnboardingState.AccountConnected ||
    (onboardingState === OnboardingState.WalletConnected && subaccountId !== undefined)
);

/**
 * @description calculate whether the client is in view only mode
 * (Onboarding State is WalletConnected and Abacus has a connected subaccount)
 */
export const calculateIsAccountViewOnly = createSelector(
  [getOnboardingState, calculateCanViewAccount],
  (onboardingState: OnboardingState, canViewAccountInfo: boolean) =>
    onboardingState !== OnboardingState.AccountConnected && canViewAccountInfo
);

/**
 * @description calculate whether the subaccount has open positions
 */
export const calculateHasOpenPositions = createSelector(
  [getExistingOpenPositions],
  (openPositions?: SubaccountPosition[]) => (openPositions?.length || 0) > 0
);

export const calculateHasUncommittedOrders = createSelector(
  [getUncommittedOrderClientIds],
  (uncommittedOrderClientIds: number[]) => uncommittedOrderClientIds.length > 0
);

/**
 * @description calculate whether the client is loading info.
 * (account is connected but subaccountId is till missing)
 */
export const calculateIsAccountLoading = createSelector(
  [getOnboardingState, getOnboardingGuards, getSubaccountId],
  (
    onboardingState: ReturnType<typeof getOnboardingState>,
    onboardingGuards: ReturnType<typeof getOnboardingGuards>,
    subaccountId?: number
  ) => {
    const { hasPreviousTransactions } = onboardingGuards;
    return (
      onboardingState === OnboardingState.AccountConnected &&
      subaccountId === undefined &&
      hasPreviousTransactions
    );
  }
);

/**
 * @description calculate whether the current session is geo-restricted
 */
export const calculateIsGeoRestricted = createSelector(
  [getRestrictionType],
  (restrictionType?: Nullable<RestrictionTypes>) =>
    restrictionType === RestrictionType.GEO_RESTRICTED
);
