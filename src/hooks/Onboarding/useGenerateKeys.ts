import { useEffect, useState } from 'react';

import { log } from 'console';
import { AES } from 'crypto-js';

import { EvmDerivedAccountStatus } from '@/constants/account';
import { AnalyticsEvents } from '@/constants/analytics';
import { DydxAddress } from '@/constants/wallets';

import { useAppDispatch } from '@/state/appTypes';
import { setSavedEncryptedSignature } from '@/state/wallet';

import { track } from '@/lib/analytics/analytics';
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
  const dispatch = useAppDispatch();
  const { status, setStatus, onKeysDerived } = generateKeysProps ?? {};
  const { sourceAccount, setWalletFromSignature } = useAccounts();
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

  // 2. Derive keys from EVM account
  const { getWalletFromSignature } = useDydxClient();
  const { getSubaccounts } = useAccounts();

  const isDeriving = ![
    EvmDerivedAccountStatus.NotDerived,
    EvmDerivedAccountStatus.Derived,
  ].includes(derivationStatus);

  const signMessageAsync = useSignForWalletDerivation(sourceAccount.walletInfo);

  const staticEncryptionKey = import.meta.env.VITE_PK_ENCRYPTION_KEY;

  const deriveKeys = async () => {
    setError(undefined);

    try {
      // 1. First signature
      setDerivationStatus(EvmDerivedAccountStatus.Deriving);

      const signature = await signMessageAsync();
      track(
        AnalyticsEvents.OnboardingDeriveKeysSignatureReceived({
          signatureNumber: 1,
        })
      );
      const { wallet: dydxWallet } = await getWalletFromSignature({ signature });

      // 2. Ensure signature is deterministic
      // Check if subaccounts exist
      const dydxAddress = dydxWallet.address as DydxAddress;
      let hasPreviousTransactions = false;

      try {
        const subaccounts = await getSubaccounts({ dydxAddress });
        hasPreviousTransactions = subaccounts.length > 0;

        track(AnalyticsEvents.OnboardingAccountDerived({ hasPreviousTransactions }));

        if (!hasPreviousTransactions) {
          setDerivationStatus(EvmDerivedAccountStatus.EnsuringDeterminism);

          // Second signature
          const additionalSignature = await signMessageAsync();
          track(
            AnalyticsEvents.OnboardingDeriveKeysSignatureReceived({
              signatureNumber: 2,
            })
          );

          if (signature !== additionalSignature) {
            throw new Error(
              'Your wallet does not support deterministic signing. Please switch to a different wallet provider.'
            );
          }
        }
      } catch (err) {
        setDerivationStatus(EvmDerivedAccountStatus.NotDerived);
        const { message } = parseWalletError({ error: err, stringGetter });

        if (message) {
          track(AnalyticsEvents.OnboardingWalletIsNonDeterministic());
          setError(message);
        }
        return;
      }

      await setWalletFromSignature(signature);

      // 3: Remember me (encrypt and store signature)
      if (staticEncryptionKey) {
        const encryptedSignature = AES.encrypt(signature, staticEncryptionKey).toString();
        dispatch(setSavedEncryptedSignature(encryptedSignature));
      }

      // 4. Done
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
