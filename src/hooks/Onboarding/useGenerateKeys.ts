import { useEffect, useState } from 'react';

import { log } from 'console';

import { EvmDerivedAccountStatus } from '@/constants/account';
import { AnalyticsEvents, AnalyticsUserProperties } from '@/constants/analytics';
import { DydxAddress } from '@/constants/wallets';

import { identify, track } from '@/lib/analytics/analytics';
import { onboardingManager } from '@/lib/onboarding/OnboardingSupervisor';
import { parseWalletError } from '@/lib/wallet';

import { useAccounts } from '../useAccounts';
import { useDydxClient } from '../useDydxClient';
import { useEnvConfig } from '../useEnvConfig';
import { useMatchingEvmNetwork } from '../useMatchingEvmNetwork';
import useSignForWalletDerivation from '../useSignForWalletDerivation';
import { useStringGetter } from '../useStringGetter';

type GenerateKeysProps = {
  status?: EvmDerivedAccountStatus;
  setStatus?: (status: EvmDerivedAccountStatus) => void;
  onKeysDerived?: () => void;
};

export function useGenerateKeys(generateKeysProps?: GenerateKeysProps) {
  const stringGetter = useStringGetter();
  const { status, setStatus, onKeysDerived } = generateKeysProps ?? {};
  const { sourceAccount } = useAccounts();
  const [derivationStatus, setDerivationStatus] = useState(
    status ?? EvmDerivedAccountStatus.NotDerived
  );

  // status should track derivationStatus for OnboardingDialog
  useEffect(() => {
    setStatus?.(derivationStatus);
  }, [derivationStatus, setStatus]);

  const [error, setError] = useState<string>();

  // 1. Switch network
  const ethereumChainId = useEnvConfig('ethereumChainId');
  const chainId = Number(ethereumChainId);

  const { isMatchingNetwork, matchNetwork, isSwitchingNetwork } = useMatchingEvmNetwork({
    chainId,
  });

  const switchNetwork = async () => {
    setError(undefined);

    try {
      await matchNetwork();
      return true;
    } catch (err) {
      const { message, walletErrorType, isErrorExpected } = parseWalletError({
        error: err,
        stringGetter,
      });

      if (!isErrorExpected) {
        log('GenerateKeys/switchNetwork', err, { walletErrorType });
      }

      if (message) {
        setError(message);
      }

      return false;
    }
  };

  const switchNetworkAndDeriveKeys = async () => {
    const networkSwitched = await switchNetwork();
    if (networkSwitched) await deriveKeys().then(onKeysDerived);
  };

  // 2. Derive keys from EVM account using OnboardingSupervisor
  const { getWalletFromSignature } = useDydxClient();

  const { getSubaccounts, handleWalletConnectionResult } = useAccounts();

  const isDeriving = ![
    EvmDerivedAccountStatus.NotDerived,
    EvmDerivedAccountStatus.Derived,
  ].includes(derivationStatus);

  const signMessageAsync = useSignForWalletDerivation(sourceAccount.walletInfo);

  const deriveKeys = async () => {
    setError(undefined);

    try {
      setDerivationStatus(EvmDerivedAccountStatus.Deriving);

      // Track first signature request
      const wrappedSignMessage = async (requestNumber: 1 | 2) => {
        if (requestNumber === 2) {
          setDerivationStatus(EvmDerivedAccountStatus.EnsuringDeterminism);
        }

        const sig = await signMessageAsync();

        track(
          AnalyticsEvents.OnboardingDeriveKeysSignatureReceived({ signatureNumber: requestNumber })
        );

        return sig;
      };

      // Check for previous transactions
      const checkPreviousTransactions = async (dydxAddress: DydxAddress) => {
        const subaccounts = await getSubaccounts({ dydxAddress });
        const hasPreviousTransactions = subaccounts.length > 0;

        track(AnalyticsEvents.OnboardingAccountDerived({ hasPreviousTransactions }));
        identify(AnalyticsUserProperties.IsNewUser(!hasPreviousTransactions));

        return hasPreviousTransactions;
      };

      // Derive with determinism check
      const result = await onboardingManager.deriveKeysWithDeterminismCheck({
        signMessageAsync: wrappedSignMessage,
        getWalletFromSignature,
        checkPreviousTransactions,
        handleWalletConnectionResult,
      });

      if (!result.success) {
        setDerivationStatus(EvmDerivedAccountStatus.NotDerived);

        if (result.isDeterminismError) {
          track(AnalyticsEvents.OnboardingWalletIsNonDeterministic());
        }

        setError(result.error);
        return;
      }

      // Done - wallet is already persisted to SecureStorage by OnboardingSupervisor
      setDerivationStatus(EvmDerivedAccountStatus.Derived);
    } catch (err) {
      setDerivationStatus(EvmDerivedAccountStatus.NotDerived);
      const { message, walletErrorType, isErrorExpected } = parseWalletError({
        error: err,
        stringGetter,
      });

      if (message) {
        setError(message);
        if (!isErrorExpected) {
          log('GenerateKeys/deriveKeys', err, { walletErrorType });
        }
      }
    }
  };

  const onClickSwitchNetwork = () => {
    switchNetworkAndDeriveKeys().then(onKeysDerived);
    track(AnalyticsEvents.OnboardingSwitchNetworkClick());
  };

  const onClickSendRequestOrTryAgain = () => {
    deriveKeys().then(onKeysDerived);
    track(
      AnalyticsEvents.OnboardingSendRequestClick({
        firstAttempt: !error,
      })
    );
  };

  return {
    error,
    isDeriving,
    isMatchingNetwork,
    isSwitchingNetwork,
    onClickSwitchNetwork,
    onClickSendRequestOrTryAgain,
  };
}
