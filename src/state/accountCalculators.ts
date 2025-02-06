import { BonsaiCore } from '@/bonsai/ontology';
import { VaultFormAccountData } from '@/bonsai/public-calculators/vaultFormValidation';

import { OnboardingState, OnboardingSteps } from '@/constants/account';

import {
  getOnboardingGuards,
  getOnboardingState,
  getSubaccountOpenOrders,
  getUnbondingDelegations,
} from '@/state/accountSelectors';
import { createAppSelector } from '@/state/appTypes';

import { isNewOrderStatusOpen } from '@/lib/orders';

import { getSubaccountId } from './accountInfoSelectors';
import { getCurrentMarketId } from './currentMarketSelectors';

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
      return openOrders.some(
        (order) =>
          (!marketId || order.marketId === marketId) &&
          order.status != null &&
          isNewOrderStatusOpen(order.status)
      );
    }
  );

export const calculateHasCancelableOrdersInOtherMarkets = createAppSelector(
  [getSubaccountOpenOrders, getCurrentMarketId],
  (openOrders, marketId) =>
    marketId !== undefined &&
    openOrders.some(
      (order) =>
        order.marketId !== marketId && order.status != null && isNewOrderStatusOpen(order.status)
    )
);

const selectCurrentMarginUsage = createAppSelector(
  [BonsaiCore.account.parentSubaccountSummary.data],
  (d) => d?.marginUsage?.toNumber()
);
const selectCurrentFreeCollateral = createAppSelector(
  [BonsaiCore.account.parentSubaccountSummary.data],
  (d) => d?.freeCollateral.toNumber()
);
export const selectSubaccountStateForVaults = createAppSelector(
  [selectCurrentMarginUsage, selectCurrentFreeCollateral, calculateCanViewAccount],
  (marginUsage, freeCollateral, canViewAccount): VaultFormAccountData => ({
    marginUsage: marginUsage ?? undefined,
    freeCollateral: freeCollateral ?? undefined,
    canViewAccount,
  })
);
