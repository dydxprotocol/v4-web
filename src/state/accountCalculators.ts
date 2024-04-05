import { createSelector } from 'reselect';

import { OnboardingState, OnboardingSteps } from '@/constants/account';
import { ComplianceStates, ComplianceStatus, RestrictedGeo } from '@/constants/compliance';

import {
  getOnboardingGuards,
  getOnboardingState,
  getSubaccountId,
  getUncommittedOrderClientIds,
  getComplianceStatus,
} from '@/state/accountSelectors';

import { testFlags } from '@/lib/testFlags';

import { getGeo } from './appSelectors';

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
  [getOnboardingState],
  (onboardingState: OnboardingState) => {
    return onboardingState === OnboardingState.AccountConnected;
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
 * @description calculate whether the subaccount has uncommitted positions
 */
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
 * @description calculate whether positions table should render triggers column
 */
export const calculateShouldRenderTriggersInPositionsTable = createSelector(
  [calculateIsAccountViewOnly],
  (isAccountViewOnly: boolean) => !isAccountViewOnly && testFlags.configureSlTpFromPositionsTable
);

/**
 * @description calculate whether positions table should render actions column
 */
export const calculateShouldRenderActionsInPositionsTable = createSelector(
  [calculateIsAccountViewOnly],
  (isAccountViewOnly: boolean) => !isAccountViewOnly
);

/**
 * @description calculate the compliance state
 */
export const calculateComplianceState = createSelector(
  [getComplianceStatus, getGeo],
  (status?: string, geo?: string) => {
    if (status === ComplianceStatus.FIRST_STRIKE || status === ComplianceStatus.CLOSE_ONLY) {
      return ComplianceStates.CLOSE_ONLY;
    }
    if (status === ComplianceStatus.BLOCKED || RestrictedGeo.includes(geo || '')) {
      return ComplianceStates.READ_ONLY;
    }
    return ComplianceStates.FULLACCESS;
  }
);
