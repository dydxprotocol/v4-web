import { useEffect, useState } from 'react';

import { shallowEqual } from 'react-redux';
import { useLocation } from 'react-router-dom';

import {
  AnalyticsEvent,
  AnalyticsUserProperty,
  lastSuccessfulWebsocketRequestByOrigin,
} from '@/constants/analytics';
import type { DialogTypes } from '@/constants/dialogs';

import { calculateOnboardingStep } from '@/state/accountCalculators';
import { getOnboardingState, getSubaccountId } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getActiveDialog } from '@/state/dialogsSelectors';
import { getInputTradeData } from '@/state/inputsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { identify, track } from '@/lib/analytics';
import { getSelectedTradeType } from '@/lib/tradeData';

import { useAccounts } from './useAccounts';
import { useApiState } from './useApiState';
import { useBreakpoints } from './useBreakpoints';
import { useDydxClient } from './useDydxClient';
import { useSelectedNetwork } from './useSelectedNetwork';

export const useAnalytics = () => {
  const latestTag = import.meta.env.VITE_LAST_TAG;
  const { walletType, walletConnectionType, evmAddress, dydxAddress, selectedWalletType } =
    useAccounts();
  const { indexerClient } = useDydxClient();

  /** User properties */

  // AnalyticsUserProperty.Breakpoint
  const breakpointMatches = useBreakpoints();

  const breakpoint = breakpointMatches.isMobile
    ? 'MOBILE'
    : breakpointMatches.isTablet
      ? 'TABLET'
      : breakpointMatches.isDesktopSmall
        ? 'DESKTOP_SMALL'
        : breakpointMatches.isDesktopMedium
          ? 'DESKTOP_MEDIUM'
          : breakpointMatches.isDesktopLarge
            ? 'DESKTOP_LARGE'
            : 'UNSUPPORTED';

  useEffect(() => {
    identify(AnalyticsUserProperty.Breakpoint, breakpoint);
  }, [breakpoint]);

  // AnalyticsUserProperty.Locale
  const selectedLocale = useAppSelector(getSelectedLocale);

  useEffect(() => {
    identify(AnalyticsUserProperty.Locale, selectedLocale);
  }, [selectedLocale]);

  // AnalyticsUserProperty.Version
  useEffect(() => {
    if (latestTag !== undefined) {
      identify(AnalyticsUserProperty.Version, latestTag.split(`release/v`).at(-1));
    }
  }, [latestTag]);

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
    identify(AnalyticsUserProperty.WalletAddress, evmAddress ?? dydxAddress);
  }, [evmAddress, dydxAddress]);

  // AnalyticsUserProperty.DydxAddress
  useEffect(() => {
    identify(AnalyticsUserProperty.DydxAddress, dydxAddress);
  }, [dydxAddress]);

  // AnalyticsUserProperty.SubaccountNumber
  const subaccountNumber = useAppSelector(getSubaccountId);
  useEffect(() => {
    identify(AnalyticsUserProperty.SubaccountNumber, subaccountNumber);
  }, [subaccountNumber]);

  /** Events */

  // AnalyticsEvent.AppStart
  useEffect(() => {
    track(AnalyticsEvent.AppStart);
  }, []);

  // AnalyticsEvent.NetworkStatus
  const { height, indexerHeight, status, trailingBlocks } = useApiState();

  useEffect(() => {
    if (status) {
      const websocketEndpoint = indexerClient.config.websocketEndpoint;

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
        trailingBlocks: trailingBlocks ?? undefined,
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
  const activeDialog = useAppSelector(getActiveDialog);
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

      if (
        anchorElement instanceof HTMLAnchorElement &&
        anchorElement.href &&
        anchorElement.hostname !== globalThis.location.hostname
      )
        track(AnalyticsEvent.NavigateExternal, { link: anchorElement.href });
    };
    globalThis.addEventListener('click', onClick);

    return () => globalThis.removeEventListener('click', onClick);
  }, []);

  // AnalyticsEvent.OnboardingStepChanged
  const currentOnboardingStep = useAppSelector(calculateOnboardingStep);
  const onboardingState = useAppSelector(getOnboardingState);
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

  // AnalyticsEvent.ConnectWallet
  // AnalyticsEvent.DisconnectWallet
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
  const { type: selectedOrderType } = useAppSelector(getInputTradeData, shallowEqual) ?? {};
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
