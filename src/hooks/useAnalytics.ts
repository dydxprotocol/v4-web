import { useEffect, useRef, useState } from 'react';

import { shallowEqual } from 'react-redux';
import { useLocation } from 'react-router-dom';

import {
  AnalyticsEvents,
  AnalyticsUserProperties,
  lastSuccessfulWebsocketRequestByOrigin,
} from '@/constants/analytics';
import { DialogTypesTypes } from '@/constants/dialogs';
import { WalletInfo } from '@/constants/wallets';

import { calculateOnboardingStep } from '@/state/accountCalculators';
import { getSubaccountId } from '@/state/accountInfoSelectors';
import { getGeo, getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getActiveDialog } from '@/state/dialogsSelectors';
import { getInputTradeData } from '@/state/inputsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { identify, track } from '@/lib/analytics/analytics';
import { getSelectedTradeType } from '@/lib/tradeData';

import { useAccounts } from './useAccounts';
import { useApiState } from './useApiState';
import { useBreakpoints } from './useBreakpoints';
import { useDydxClient } from './useDydxClient';
import { useReferredBy } from './useReferredBy';
import { useSelectedNetwork } from './useSelectedNetwork';
import { useAllStatsigGateValues } from './useStatsig';

export const useAnalytics = () => {
  const latestCommit = import.meta.env.VITE_LAST_ORIGINAL_COMMIT;
  const { sourceAccount, selectedWallet, dydxAddress } = useAccounts();
  const { indexerClient } = useDydxClient();
  const statsigConfig = useAllStatsigGateValues();
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

  // AnalyticsUserProperty.Geo
  const geo = useAppSelector(getGeo) ?? undefined;
  useEffect(() => {
    identify(AnalyticsUserProperties.Geo(geo ?? null));
  }, [geo]);

  useEffect(() => {
    identify(AnalyticsUserProperties.CustomDomainReferrer(document.referrer));
  }, []);

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
    if (latestCommit !== undefined) {
      identify(AnalyticsUserProperties.Version(latestCommit));
    }
  }, [latestCommit]);

  // AnalyticsUserProperty.StatsigConfigs
  useEffect(() => {
    identify(AnalyticsUserProperties.StatsigFlags(statsigConfig));
  }, [statsigConfig]);

  // AnalyticsUserProperty.Network
  const { selectedNetwork } = useSelectedNetwork();

  useEffect(() => {
    identify(AnalyticsUserProperties.Network(selectedNetwork));
  }, [selectedNetwork]);

  // AnalyticsUserProperty.WalletType
  useEffect(() => {
    identify(AnalyticsUserProperties.WalletType(sourceAccount.walletInfo?.name ?? null));
  }, [sourceAccount.walletInfo?.name]);

  // AnalyticsUserProperty.WalletConnectorType
  useEffect(() => {
    identify(
      AnalyticsUserProperties.WalletConnectorType(sourceAccount.walletInfo?.connectorType ?? null)
    );
  }, [sourceAccount.walletInfo?.connectorType]);

  // AnalyticsUserProperty.WalletAddress
  useEffect(() => {
    identify(AnalyticsUserProperties.WalletAddress(sourceAccount.address ?? null));
  }, [sourceAccount.address]);

  // AnalyticsUserProperty.DydxAddress
  useEffect(() => {
    identify(AnalyticsUserProperties.DydxAddress(dydxAddress ?? null));
  }, [dydxAddress]);

  useEffect(() => {
    identify(
      AnalyticsUserProperties.IsRememberMe(
        dydxAddress ? Boolean(sourceAccount.encryptedSignature) : null
      )
    );
  }, [dydxAddress, sourceAccount.encryptedSignature]);

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
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          lastSuccessfulWebsocketRequestByOrigin[new URL(websocketEndpoint).origin]) ||
        undefined;

      track(
        AnalyticsEvents.NetworkStatus({
          status,
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
  const previousPathRef = useRef(location.pathname);
  useEffect(() => {
    // Ignore hashchange events from <iframe>s x_x
    if (location.pathname.startsWith('/')) {
      const previousPath = previousPathRef.current;
      track(AnalyticsEvents.NavigatePage({ path: location.pathname, previousPath }));
      previousPathRef.current = location.pathname;
    }
  }, [location]);

  // AnalyticsEvent.NavigateDialog
  // AnalyticsEvent.NavigateDialogClose
  const activeDialog = useAppSelector(getActiveDialog);
  const previousActiveDialogTypeRef = useRef<DialogTypesTypes | undefined>(undefined);
  const previousActiveDialogType = previousActiveDialogTypeRef.current;

  useEffect(
    () => {
      if (activeDialog?.type) {
        track(
          AnalyticsEvents.NavigateDialog({
            type: activeDialog.type,
            fromDialogType: previousActiveDialogType,
          })
        );
      }

      if (previousActiveDialogType) {
        track(AnalyticsEvents.NavigateDialogClose({ type: previousActiveDialogType }));
      }

      previousActiveDialogTypeRef.current = activeDialog?.type;
    },
    // This effect should only trigger on updates to the current active dialog, not previousActiveDialogType
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeDialog]
  );

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
  const [previousSelectedWallet, setPreviousSelectedWallet] = useState<WalletInfo>();

  useEffect(() => {
    if (selectedWallet) {
      track(
        AnalyticsEvents.ConnectWallet({
          walletType: selectedWallet.name,
          walletConnectorType: selectedWallet.connectorType!,
        })
      );
    } else if (previousSelectedWallet) {
      track(AnalyticsEvents.DisconnectWallet());
    }

    setPreviousSelectedWallet(selectedWallet);
  }, [previousSelectedWallet, selectedWallet]);

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

  const { data: referredBy, isFetched: isReferredByFetched } = useReferredBy();

  useEffect(() => {
    if (isReferredByFetched && referredBy) {
      identify(AnalyticsUserProperties.AffiliateAddress(referredBy.affiliateAddress ?? null));
    }
  }, [isReferredByFetched, referredBy]);
};
