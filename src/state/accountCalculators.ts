import { OnboardingState, OnboardingSteps } from '@/constants/account';

import {
  getOnboardingGuards,
  getOnboardingState,
  getSubaccountId,
  getSubaccountOpenOrders,
  getUnbondingDelegations,
  getUncommittedOrderClientIds,
} from '@/state/accountSelectors';
import { createAppSelector } from '@/state/appTypes';

import { isOrderStatusOpen } from '@/lib/orders';

export const calculateOnboardingStep = createAppSelector(
  [getOnboardingState, getOnboardingGuards],
  (onboardingState: OnboardingState, onboardingGuards: ReturnType<typeof getOnboardingGuards>) => {
    const { hasPreviousTransactions } = onboardingGuards;

    return {
      [OnboardingState.Disconnected]: OnboardingSteps.ChooseWallet,
      [OnboardingState.WalletConnected]: OnboardingSteps.KeyDerivation,
      [OnboardingState.AccountConnected]: !hasPreviousTransactions
        ? OnboardingSteps.DepositFunds
        : undefined,
    }[onboardingState];
  }
);

/**
 * @description calculate whether an account is in a state where they can trade
 */
export const calculateCanAccountTrade = createAppSelector(
  [getOnboardingState],
  (onboardingState: OnboardingState) => {
    return onboardingState === OnboardingState.AccountConnected;
  }
);

/**
 * @description calculate whether the client has enough information to display account info.
 * User does not have to have AccountConnected. The dYdX account can be viewed if the client knows the dYdX address.
 */
export const calculateCanViewAccount = createAppSelector(
  [getOnboardingState, getSubaccountId],
  (onboardingState: OnboardingState, subaccountId?: number) =>
    onboardingState === OnboardingState.AccountConnected ||
    (onboardingState === OnboardingState.WalletConnected && subaccountId !== undefined)
);

/**
 * @description calculate whether the client is in view only mode
 * (Onboarding State is WalletConnected and Abacus has a connected subaccount)
 */
export const calculateIsAccountViewOnly = createAppSelector(
  [getOnboardingState, calculateCanViewAccount],
  (onboardingState: OnboardingState, canViewAccountInfo: boolean) =>
    onboardingState !== OnboardingState.AccountConnected && canViewAccountInfo
);

/**
 * @description calculate whether the subaccount has uncommitted positions
 */
export const calculateHasUncommittedOrders = createAppSelector(
  [getUncommittedOrderClientIds],
  (uncommittedOrderClientIds: number[]) => uncommittedOrderClientIds.length > 0
);

/**
 * @description calculate whether the client is loading info.
 * (account is connected but subaccountId is till missing)
 */
export const calculateIsAccountLoading = createAppSelector(
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
export const calculateShouldRenderTriggersInPositionsTable = createAppSelector(
  [calculateIsAccountViewOnly],
  (isAccountViewOnly: boolean) => !isAccountViewOnly
);

/**
 * @description calculate whether positions table should render actions column
 */
export const calculateShouldRenderActionsInPositionsTable = () =>
  createAppSelector(
    [calculateIsAccountViewOnly, (s, isCloseActionShown: boolean = true) => isCloseActionShown],
    (isAccountViewOnly: boolean, isCloseActionShown) => {
      const hasActionsInColumn = isCloseActionShown;
      return !isAccountViewOnly && hasActionsInColumn;
    }
  );

/**
 * @description calculate sorted unbonding delegations (from soonest to complete unbonding -> latest)
 */
export const calculateSortedUnbondingDelegations = createAppSelector(
  [getUnbondingDelegations],
  (unbondingDelegations) => {
    if (unbondingDelegations?.length) {
      const sortedUnbondingDelegations = [...unbondingDelegations];
      sortedUnbondingDelegations.sort(
        (a, b) => new Date(a.completionTime).getTime() - new Date(b.completionTime).getTime()
      );
      return sortedUnbondingDelegations;
    }
    return unbondingDelegations;
  }
);

export const calculateHasCancelableOrders = () =>
  createAppSelector(
    [getSubaccountOpenOrders, (s, marketId?: string) => marketId],
    (openOrders, marketId) => {
      // the extra isOrderStatusOpen check filter the order to also not be canceling / best effort canceled
      return (
        openOrders?.some(
          (order) => (!marketId || order.marketId === marketId) && isOrderStatusOpen(order.status)
        ) ?? false
      );
    }
  );
