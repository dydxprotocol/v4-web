import { useCallback, useMemo } from 'react';

import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';

import { OnboardingSteps } from '@/constants/account';
import { ConnectorType, WalletInfo } from '@/constants/wallets';

import {
  useDetectedWalletBrowser,
  WalletBrowser,
} from '@/hooks/Onboarding/useDetectedWalletBrowser';
import { useDisplayedWallets } from '@/hooks/useDisplayedWallets';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';

import { calculateOnboardingStep } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { sleep } from '@/lib/timeUtils';

import { useWalletConnection } from '../useWalletConnection';
import { useGenerateKeys } from './useGenerateKeys';

export function useAutoconnectMobileWalletBrowser() {
  const { detectedBrowser } = useDetectedWalletBrowser();
  const displayedWallets = useDisplayedWallets();
  const currentOnboardingStep = useAppSelector(calculateOnboardingStep);
  const isSimpleUi = useSimpleUiEnabled();
  const { hasAttemptedMobileWalletConnect, selectWallet, setHasAttemptedMobileWalletConnect } =
    useWalletConnection();

  const injectedWallet: WalletInfo | undefined = useMemo(() => {
    return displayedWallets.find((wallet) => {
      return wallet.connectorType === ConnectorType.Injected;
    });
  }, [displayedWallets]);

  const isUsingWalletBrowser = useMemo(() => {
    return detectedBrowser !== WalletBrowser.Standard;
  }, [detectedBrowser]);

  // Coinbase wallet is not injected, so we need to manually check for it
  // const isCoinbaseWallet = useMemo(() => {
  //   return displayedWallets.some((wallet) => wallet.name === WalletType.CoinbaseWallet);
  // }, [displayedWallets]);

  const canAutoconnectMobileWallet = useMemo(() => {
    const injectedWallets = displayedWallets.filter((wallet) => {
      return wallet.connectorType === ConnectorType.Injected;
    });

    return (
      isSimpleUi &&
      isUsingWalletBrowser &&
      injectedWallets.length === 1 &&
      currentOnboardingStep === OnboardingSteps.ChooseWallet
    );
  }, [isSimpleUi, isUsingWalletBrowser, displayedWallets, currentOnboardingStep]);

  const { isMatchingNetwork, onClickSwitchNetwork, onClickSendRequestOrTryAgain } = useGenerateKeys(
    {
      status: undefined,
      setStatus: undefined,
      onKeysDerived: undefined,
    }
  );

  const autoconnectMobileWallet = useCallback(async () => {
    if (injectedWallet && canAutoconnectMobileWallet) {
      try {
        logBonsaiInfo('useAutoconnectMobileWalletBrowser', 'Autoconnecting mobile wallet', {
          injectedWallet,
          isMatchingNetwork,
        });
        setHasAttemptedMobileWalletConnect(true);
        await selectWallet(injectedWallet);
        await sleep(500);

        if (isMatchingNetwork) {
          onClickSendRequestOrTryAgain();
        } else {
          onClickSwitchNetwork();
        }
      } catch (error) {
        logBonsaiError('useAutoconnectMobileWalletBrowser', 'Autoconnecting mobile wallet', {
          error,
        });
      }
    }
  }, [
    canAutoconnectMobileWallet,
    injectedWallet,
    selectWallet,
    setHasAttemptedMobileWalletConnect,
    isMatchingNetwork,
    onClickSwitchNetwork,
    onClickSendRequestOrTryAgain,
  ]);

  return {
    hasAttemptedMobileWalletConnect,
    autoconnectMobileWallet,
    canAutoconnectMobileWallet,
  };
}
