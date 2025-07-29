import { useCallback, useMemo } from 'react';

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

import { useWalletConnection } from '../useWalletConnection';

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

  const autoconnectMobileWallet = useCallback(() => {
    if (injectedWallet && canAutoconnectMobileWallet) {
      setHasAttemptedMobileWalletConnect(true);
      selectWallet(injectedWallet);
    }
  }, [
    canAutoconnectMobileWallet,
    injectedWallet,
    selectWallet,
    setHasAttemptedMobileWalletConnect,
  ]);

  return {
    hasAttemptedMobileWalletConnect,
    autoconnectMobileWallet,
    canAutoconnectMobileWallet,
  };
}
