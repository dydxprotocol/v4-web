import { useCallback, useEffect, useMemo, useState } from 'react';

import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';

import { OnboardingSteps } from '@/constants/account';
import { ConnectorType, WalletInfo, WalletType } from '@/constants/wallets';

import {
  useDetectedWalletBrowser,
  WalletBrowser,
} from '@/hooks/Onboarding/useDetectedWalletBrowser';
import { useDisplayedWallets } from '@/hooks/useDisplayedWallets';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';

import { calculateOnboardingStep } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

import { sleep } from '@/lib/timeUtils';

import { useAccounts } from '../useAccounts';
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

  // Coinbase wallet is not injected, so we need to manually check for it
  const maybeCoinbaseWallet: WalletInfo | undefined = useMemo(() => {
    if (detectedBrowser === WalletBrowser.Coinbase) {
      return {
        connectorType: ConnectorType.Coinbase,
        name: WalletType.CoinbaseWallet,
      } as const;
    }
    return undefined;
  }, [detectedBrowser]);

  const walletToConnect = useMemo(() => {
    if (maybeCoinbaseWallet) {
      return maybeCoinbaseWallet;
    }

    return injectedWallet;
  }, [maybeCoinbaseWallet, injectedWallet]);

  const canAutoconnectMobileWallet = useMemo(() => {
    const injectedWallets = displayedWallets.filter((wallet) => {
      return wallet.connectorType === ConnectorType.Injected;
    });

    const hasValidWallet =
      injectedWallets.length === 1 || (injectedWallets.length === 0 && walletToConnect != null);

    return (
      isSimpleUi &&
      isUsingWalletBrowser &&
      hasValidWallet &&
      currentOnboardingStep === OnboardingSteps.ChooseWallet
    );
  }, [isSimpleUi, isUsingWalletBrowser, displayedWallets, currentOnboardingStep, walletToConnect]);

  const { sourceAccount } = useAccounts();
  const { walletInfo } = sourceAccount;
  const [shouldRecoverKeys, setShouldRecoverKeys] = useState(false);

  const autoconnectMobileWallet = useCallback(async () => {
    if (walletToConnect && canAutoconnectMobileWallet) {
      try {
        logBonsaiInfo('useAutoconnectMobileWalletBrowser', 'Autoconnecting mobile wallet', {
          walletToConnect,
        });
        setHasAttemptedMobileWalletConnect(true);
        await selectWallet(walletToConnect);
        await sleep(500);
        setShouldRecoverKeys(true);
      } catch (error) {
        logBonsaiError('useAutoconnectMobileWalletBrowser', 'Autoconnecting mobile wallet', {
          error,
        });
      }
    }
  }, [
    canAutoconnectMobileWallet,
    walletToConnect,
    selectWallet,
    setHasAttemptedMobileWalletConnect,
  ]);

  useEffect(() => {
    if (shouldRecoverKeys && walletInfo) {
      setShouldRecoverKeys(false);
    }
  }, [shouldRecoverKeys, walletInfo]);

  return {
    hasAttemptedMobileWalletConnect,
    autoconnectMobileWallet,
    canAutoconnectMobileWallet,
    walletInfo,
  };
}
