import { useEffect, useState } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { AnalyticsEvent, AnalyticsUserProperty } from '@/constants/analytics';

import { track, identify } from '@/lib/analytics';

import { useApiState } from './useApiState';
import { useBreakpoints } from './useBreakpoints';
import { useSelectedNetwork } from './useSelectedNetwork';
import { useAccounts } from './useAccounts';
import { useDydxClient } from './useDydxClient';

import { getSelectedLocale } from '@/state/localizationSelectors';
import { getOnboardingState, getSubaccountId } from '@/state/accountSelectors';
import { calculateOnboardingStep } from '@/state/accountCalculators';
import { getActiveDialog } from '@/state/dialogsSelectors';
import type { DialogTypes } from '@/constants/dialogs';

import { getSelectedTradeType } from '@/lib/tradeData';
import { getInputTradeData } from '@/state/inputsSelectors';

export const useAnalytics = () => {
  const { walletType, walletConnectionType, evmAddress, dydxAddress, selectedWalletType } = useAccounts();
  const { compositeClient } = useDydxClient();

  /** User properties */

  // AnalyticsUserProperty.Breakpoint
  const breakpointMatches = useBreakpoints();

  const breakpoint =
    breakpointMatches.isMobile ?
      'MOBILE'
    : breakpointMatches.isTablet ?
        'TABLET'
    : breakpointMatches.isDesktopSmall ?
        'DESKTOP_SMALL'
    : breakpointMatches.isDesktopMedium ?
        'DESKTOP_MEDIUM'
    : breakpointMatches.isDesktopLarge ?
        'DESKTOP_LARGE'
    :
      'UNSUPPORTED';

  useEffect(() => {
    identify(AnalyticsUserProperty.Breakpoint, breakpoint);
  }, [breakpoint]);

  // AnalyticsUserProperty.Locale
  const selectedLocale = useSelector(getSelectedLocale);

  useEffect(() => {
    identify(AnalyticsUserProperty.Locale, selectedLocale);
  }, [selectedLocale]);

  // AnalyticsUserProperty.Network
  const { selectedNetwork } = useSelectedNetwork();

  useEffect(() => {
    identify(AnalyticsUserProperty.Network, selectedNetwork);
  }, [selectedNetwork]);

  // AnalyticsUserProperty.WalletType
  useEffect(() => {
    identify(AnalyticsUserProperty.WalletType, walletType);
  }, [walletType]);

  // AnalyticsUserProperty.WalletConnectionType
  useEffect(() => {
    identify(AnalyticsUserProperty.WalletConnectionType, walletConnectionType);
  }, [walletConnectionType]);

  // AnalyticsUserProperty.WalletAddress
  useEffect(() => {
    identify(AnalyticsUserProperty.WalletAddress, evmAddress || dydxAddress);
  }, [evmAddress, dydxAddress]);

  // AnalyticsUserProperty.DydxAddress
  useEffect(() => {
    identify(AnalyticsUserProperty.DydxAddress, dydxAddress);
  }, [dydxAddress]);

  // AnalyticsUserProperty.SubaccountNumber
  const subaccountNumber = useSelector(getSubaccountId);
  useEffect(() => {
    identify(AnalyticsUserProperty.SubaccountNumber, subaccountNumber);
  }, [subaccountNumber]);


  /** Events */

  // AnalyticsEvent.AppStart
  useEffect(() => {
    track(AnalyticsEvent.AppStart);
  }, []);

  // AnalyticsEvent.NetworkStatus
  const { height, indexerHeight, status } = useApiState();

  useEffect(() => {
    if (status) {
      const websocketEndpoint = compositeClient?.indexerClient?.config.websocketEndpoint;

      const lastSuccessfulIndexerRpcQuery =
        (websocketEndpoint &&
          lastSuccessfulWebsocketRequestByOrigin[new URL(websocketEndpoint).origin]) ||
        undefined;

      track(AnalyticsEvent.NetworkStatus, {
        status: status.name,
        lastSuccessfulIndexerRpcQuery,
        elapsedTime: lastSuccessfulIndexerRpcQuery && Date.now() - lastSuccessfulIndexerRpcQuery,
        blockHeight: height ?? undefined,
        indexerBlockHeight: indexerHeight ?? undefined,
      });
    }
  }, [status]);

  // AnalyticsEvent.NavigatePage
  const location = useLocation();

  useEffect(() => {
    // Ignore hashchange events from <iframe>s x_x
    if (location.pathname.startsWith('/'))
      track(AnalyticsEvent.NavigatePage, { path: location.pathname });
  }, [location]);

  // AnalyticsEvent.NavigateDialog
  // AnalyticsEvent.NavigateDialogClose
  const activeDialog = useSelector(getActiveDialog);
  const [previousActiveDialogType, setPreviousActiveDialogType] = useState<
    DialogTypes | undefined
  >();

  useEffect(() => {
    if (activeDialog?.type) {
      track(AnalyticsEvent.NavigateDialog, { type: activeDialog.type });
    }

    if (previousActiveDialogType) {
      track(AnalyticsEvent.NavigateDialogClose, { type: previousActiveDialogType });
    }

    setPreviousActiveDialogType(activeDialog?.type);
  }, [activeDialog]);

  // AnalyticsEvent.NavigateExternal
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchorElement = (e.target as Element).closest('a');

      if (anchorElement instanceof HTMLAnchorElement && anchorElement.href && anchorElement.hostname !== globalThis.location.hostname)
        track(AnalyticsEvent.NavigateExternal, { link: anchorElement.href });
    };
    globalThis.addEventListener('click', onClick);

    return () => globalThis.removeEventListener('click', onClick);
  }, []);

  // AnalyticsEvent.OnboardingStepChanged
  const currentOnboardingStep = useSelector(calculateOnboardingStep);
  const onboardingState = useSelector(getOnboardingState);
  const [hasOnboardingStateChanged, setHasOnboardingStateChanged] = useState(false);

  useEffect(() => {
    if (hasOnboardingStateChanged) {
      track(AnalyticsEvent.OnboardingStepChanged, {
        state: onboardingState,
        step: currentOnboardingStep,
      });
    } else {
      setHasOnboardingStateChanged(true);
    }
  }, [onboardingState, currentOnboardingStep]);

  // AnalyticsEvent.OnboardingConnectWallet
  // AnalyticsEvent.OnboardingDisconnectWallet
  const [previousSelectedWalletType, setPreviousSelectedWalletType] =
    useState<typeof selectedWalletType>();

  useEffect(() => {
    if (selectedWalletType) {
      track(AnalyticsEvent.ConnectWallet, {
        walletType: selectedWalletType,
        walletConnectionType: walletConnectionType!,
      });
    } else if (previousSelectedWalletType) {
      track(AnalyticsEvent.DisconnectWallet);
    }

    setPreviousSelectedWalletType(selectedWalletType);
  }, [selectedWalletType, walletConnectionType]);

  // AnalyticsEvent.TradeOrderTypeSelected
  const { type: selectedOrderType } = useSelector(getInputTradeData, shallowEqual) ?? {};
  const [hasSelectedOrderTypeChanged, setHasSelectedOrderTypeChanged] = useState(false);

  useEffect(() => {
    if (hasSelectedOrderTypeChanged) {
      if (selectedOrderType)
        track(AnalyticsEvent.TradeOrderTypeSelected, {
          type: getSelectedTradeType(selectedOrderType),
        });
    } else {
      setHasSelectedOrderTypeChanged(true);
    }
  }, [selectedOrderType]);
};

export const lastSuccessfulRestRequestByOrigin: Record<URL['origin'], number> = {};
export const lastSuccessfulWebsocketRequestByOrigin: Record<URL['origin'], number> = {};
