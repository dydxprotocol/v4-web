import { useEffect, useState } from 'react';

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

export function useAutoconnectMobileWalletBrowser({
  onSelectWallet,
}: {
  onSelectWallet: (wallet: WalletInfo) => void;
}) {
  const [hasAttemptedMobileWalletConnect, setHasAttemptedMobileWalletConnect] = useState(false);
  const { detectedBrowser } = useDetectedWalletBrowser();
  const displayedWallets = useDisplayedWallets();
  const currentOnboardingStep = useAppSelector(calculateOnboardingStep);
  const isSimpleUi = useSimpleUiEnabled();

  useEffect(() => {
    if (!isSimpleUi || hasAttemptedMobileWalletConnect) return;

    const injectedWallets = displayedWallets.filter((wallet) => {
      return wallet.connectorType === ConnectorType.Injected;
    });

    const isUsingWalletBrowser =
      detectedBrowser !== WalletBrowser.Standard && injectedWallets.length === 1;

    if (isUsingWalletBrowser && currentOnboardingStep === OnboardingSteps.ChooseWallet) {
      const walletToConnect = injectedWallets[0];
      setHasAttemptedMobileWalletConnect(true);
      onSelectWallet(walletToConnect as WalletInfo);
    }
  }, [
    hasAttemptedMobileWalletConnect,
    detectedBrowser,
    displayedWallets,
    isSimpleUi,
    onSelectWallet,
    currentOnboardingStep,
  ]);
}
