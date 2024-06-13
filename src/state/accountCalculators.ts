import { AbacusMarginMode } from '@/constants/abacus';
import { OnboardingState, OnboardingSteps } from '@/constants/account';

import {
  getCurrentMarketHasOpenIsolatedOrders,
  getCurrentMarketPositionData,
  getOnboardingGuards,
  getOnboardingState,
  getSubaccountId,
  getUncommittedOrderClientIds,
} from '@/state/accountSelectors';

import { MustBigNumber } from '@/lib/numbers';

import { createAppSelector } from './appTypes';
import {
  getCurrentInput,
  getInputClosePositionData,
  getInputTradeMarginMode,
} from './inputsSelectors';

export const calculateOnboardingStep = createAppSelector(
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

export const calculateShouldShowIsolatedMarketPostOrderPositionMarginAsZero = createAppSelector(
  [
    getCurrentInput,
    getInputTradeMarginMode,
    getCurrentMarketHasOpenIsolatedOrders,
    getInputClosePositionData,
    getCurrentMarketPositionData,
  ],
  (
    currentInput,
    marginMode,
    hasOpenIsolatedOrders,
    closePositionInputData,
    currentMarketPosition
  ) => {
    const { size: sizeInputData } = closePositionInputData ?? {};
    const { size } = sizeInputData ?? {};
    const { size: currentPositionSize } = currentMarketPosition ?? {};
    const { current: currentSize } = currentPositionSize ?? {};
    const isFullClose = MustBigNumber(currentSize)
      .abs()
      .eq(size ?? 0);

    return (
      currentInput === 'closePosition' &&
      marginMode === AbacusMarginMode.isolated &&
      !hasOpenIsolatedOrders &&
      isFullClose
    );
  }
);
