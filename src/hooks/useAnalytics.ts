import { useEffect, useState } from 'react';

import { shallowEqual } from 'react-redux';
import { useLocation } from 'react-router-dom';

import {
  AnalyticsEvents,
  AnalyticsUserProperties,
  lastSuccessfulWebsocketRequestByOrigin,
} from '@/constants/analytics';
import { DialogTypesTypes } from '@/constants/dialogs';

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
import { StatSigFlags, useStatSigGateValue } from './useStatsig';

export const useAnalytics = () => {
  const latestTag = import.meta.env.VITE_LAST_TAG;
  const { walletType, walletConnectionType, evmAddress, dydxAddress, selectedWalletType } =
    useAccounts();
  const { indexerClient } = useDydxClient();
  const isSkipEnabled = useStatSigGateValue(StatSigFlags.ffSkipMigration);

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
    identify(AnalyticsUserProperties.Breakpoint(breakpoint));
  }, [breakpoint]);

  // AnalyticsUserProperty.Locale
  const selectedLocale = useAppSelector(getSelectedLocale);

  useEffect(() => {
    identify(AnalyticsUserProperties.Locale(selectedLocale));
  }, [selectedLocale]);

  // AnalyticsUserProperty.Version
  useEffect(() => {
    if (latestTag !== undefined) {
      identify(AnalyticsUserProperties.Version(latestTag.split(`release/v`).at(-1)));
    }
  }, [latestTag]);

  // AnalyticsUserProperty.ffSkipMigration
  useEffect(() => {
    identify(AnalyticsUserProperties.ffSkipMigration(isSkipEnabled));
  }, [isSkipEnabled]);

  // AnalyticsUserProperty.Network
  const { selectedNetwork } = useSelectedNetwork();

  useEffect(() => {
    identify(AnalyticsUserProperties.Network(selectedNetwork));
  }, [selectedNetwork]);

  // AnalyticsUserProperty.WalletType
  useEffect(() => {
    identify(AnalyticsUserProperties.WalletType(walletType ?? null));
  }, [walletType]);

  // AnalyticsUserProperty.WalletConnectionType
  useEffect(() => {
    identify(AnalyticsUserProperties.WalletConnectionType(walletConnectionType ?? null));
  }, [walletConnectionType]);

  // AnalyticsUserProperty.WalletAddress
  useEffect(() => {
    identify(AnalyticsUserProperties.WalletAddress(evmAddress ?? dydxAddress ?? null));
  }, [evmAddress, dydxAddress]);

  // AnalyticsUserProperty.DydxAddress
  useEffect(() => {
    identify(AnalyticsUserProperties.DydxAddress(dydxAddress ?? null));
  }, [dydxAddress]);

  // AnalyticsUserProperty.SubaccountNumber
  const subaccountNumber = useAppSelector(getSubaccountId);
  useEffect(() => {
    identify(AnalyticsUserProperties.SubaccountNumber(subaccountNumber ?? null));
  }, [subaccountNumber]);

  /** Events */

  // AnalyticsEvent.AppStart
  useEffect(() => {
    track(AnalyticsEvents.AppStart());
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

      track(
        AnalyticsEvents.NetworkStatus({
          status: status.name,
          lastSuccessfulIndexerRpcQuery,
          elapsedTime: lastSuccessfulIndexerRpcQuery && Date.now() - lastSuccessfulIndexerRpcQuery,
          blockHeight: height ?? undefined,
          indexerBlockHeight: indexerHeight ?? undefined,
          trailingBlocks: trailingBlocks ?? undefined,
        })
      );
    }
  }, [status]);

  // AnalyticsEvent.NavigatePage
  const location = useLocation();

  useEffect(() => {
    // Ignore hashchange events from <iframe>s x_x
    if (location.pathname.startsWith('/'))
      track(AnalyticsEvents.NavigatePage({ path: location.pathname }));
  }, [location]);

  // AnalyticsEvent.NavigateDialog
  // AnalyticsEvent.NavigateDialogClose
  const activeDialog = useAppSelector(getActiveDialog);
  const [previousActiveDialogType, setPreviousActiveDialogType] = useState<
    DialogTypesTypes | undefined
  >();

  useEffect(() => {
    if (activeDialog?.type) {
      track(AnalyticsEvents.NavigateDialog({ type: activeDialog.type }));
    }

    if (previousActiveDialogType) {
      track(AnalyticsEvents.NavigateDialogClose({ type: previousActiveDialogType }));
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
        track(AnalyticsEvents.NavigateExternal({ link: anchorElement.href }));
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
      track(
        AnalyticsEvents.OnboardingStepChanged({
          state: onboardingState,
          step: currentOnboardingStep,
        })
      );
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
      track(
        AnalyticsEvents.ConnectWallet({
          walletType: selectedWalletType,
          walletConnectionType: walletConnectionType!,
        })
      );
    } else if (previousSelectedWalletType) {
      track(AnalyticsEvents.DisconnectWallet());
    }

    setPreviousSelectedWalletType(selectedWalletType);
  }, [selectedWalletType, walletConnectionType]);

  // AnalyticsEvent.TradeOrderTypeSelected
  const { type: selectedOrderType } = useAppSelector(getInputTradeData, shallowEqual) ?? {};
  const [hasSelectedOrderTypeChanged, setHasSelectedOrderTypeChanged] = useState(false);

  useEffect(() => {
    if (hasSelectedOrderTypeChanged) {
      if (selectedOrderType)
        track(
          AnalyticsEvents.TradeOrderTypeSelected({
            type: getSelectedTradeType(selectedOrderType),
          })
        );
    } else {
      setHasSelectedOrderTypeChanged(true);
    }
  }, [selectedOrderType]);
};
