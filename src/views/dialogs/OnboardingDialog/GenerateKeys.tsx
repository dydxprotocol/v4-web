import { useState } from 'react';

import { AES } from 'crypto-js';
import styled, { css } from 'styled-components';

import { EvmDerivedAccountStatus } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { DydxAddress, WalletType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useDydxClient } from '@/hooks/useDydxClient';
import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useMatchingEvmNetwork } from '@/hooks/useMatchingEvmNetwork';
import useSignForWalletDerivation from '@/hooks/useSignForWalletDerivation';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { WithReceipt } from '@/components/WithReceipt';

import { useAppDispatch } from '@/state/appTypes';
import { setSavedEncryptedSignature } from '@/state/wallet';

import { track } from '@/lib/analytics/analytics';
import { isTruthy } from '@/lib/isTruthy';
import { log } from '@/lib/telemetry';
import { parseWalletError } from '@/lib/wallet';

type ElementProps = {
  status: EvmDerivedAccountStatus;
  setStatus: (status: EvmDerivedAccountStatus) => void;
  onKeysDerived?: () => void;
};

export const GenerateKeys = ({ status, setStatus, onKeysDerived = () => {} }: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const { sourceAccount, setWalletFromSignature } = useAccounts();

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
    if (networkSwitched) await deriveKeys();
  };

  // 2. Derive keys from EVM account
  const { getWalletFromSignature } = useDydxClient();
  const { getSubaccounts } = useAccounts();

  const isDeriving = ![
    EvmDerivedAccountStatus.NotDerived,
    EvmDerivedAccountStatus.Derived,
  ].includes(status);

  const signMessageAsync = useSignForWalletDerivation(sourceAccount.walletInfo);

  const staticEncryptionKey = import.meta.env.VITE_PK_ENCRYPTION_KEY;

  const deriveKeys = async () => {
    setError(undefined);

    try {
      // 1. First signature
      setStatus(EvmDerivedAccountStatus.Deriving);

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
          setStatus(EvmDerivedAccountStatus.EnsuringDeterminism);

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
        setStatus(EvmDerivedAccountStatus.NotDerived);
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
      setStatus(EvmDerivedAccountStatus.Derived);
    } catch (err) {
      setStatus(EvmDerivedAccountStatus.NotDerived);
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

  return (
    <>
      <div tw="grid gap-1">
        {[
          {
            status: EvmDerivedAccountStatus.Deriving,
            title: stringGetter({ key: STRING_KEYS.GENERATE_DYDX_WALLET }),
            description: stringGetter({ key: STRING_KEYS.VERIFY_WALLET_OWNERSHIP }),
          },
          status === EvmDerivedAccountStatus.EnsuringDeterminism && {
            status: EvmDerivedAccountStatus.EnsuringDeterminism,
            title: stringGetter({ key: STRING_KEYS.VERIFY_WALLET_COMPATIBILITY }),
            description: stringGetter({ key: STRING_KEYS.ENSURES_WALLET_SUPPORT }),
          },
        ]
          .filter(isTruthy)
          .map((step) => (
            <$StatusCard key={step.status} active={status === step.status}>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              {status < step.status ? (
                <LoadingSpinner disabled />
              ) : status === step.status ? (
                <LoadingSpinner />
              ) : (
                <GreenCheckCircle tw="[--icon-size:2.375rem]" />
              )}
            </$StatusCard>
          ))}
      </div>

      <$Footer>
        {error && <AlertMessage type={AlertType.Error}>{error}</AlertMessage>}
        <WithReceipt
          slotReceipt={
            <div tw="p-1 text-center text-color-text-0 font-small-medium">
              <span>
                {stringGetter({
                  key: STRING_KEYS.FREE_SIGNING,
                  params: {
                    FREE: (
                      <span tw="text-green">
                        {stringGetter({ key: STRING_KEYS.FREE_TRADING_TITLE_ASTERISK_FREE })}
                      </span>
                    ),
                  },
                })}
              </span>
            </div>
          }
          tw="[--withReceipt-backgroundColor:--color-layer-2]"
        >
          {!isMatchingNetwork && sourceAccount.walletInfo?.name !== WalletType.Phantom ? (
            <Button
              action={ButtonAction.Primary}
              onClick={onClickSwitchNetwork}
              state={{ isLoading: isSwitchingNetwork }}
            >
              {stringGetter({ key: STRING_KEYS.SWITCH_NETWORK })}
            </Button>
          ) : (
            <Button
              tw="font-small-bold"
              action={ButtonAction.Primary}
              onClick={onClickSendRequestOrTryAgain}
              withContentOnLoading
              state={{
                isLoading: isDeriving,
                isDisabled: status !== EvmDerivedAccountStatus.NotDerived,
              }}
            >
              {isDeriving
                ? stringGetter({
                    key: STRING_KEYS.CHECK_WALLET_FOR_REQUEST,
                  })
                : !error
                  ? stringGetter({
                      key: STRING_KEYS.SEND_REQUEST,
                    })
                  : stringGetter({
                      key: STRING_KEYS.TRY_AGAIN,
                    })}
            </Button>
          )}
        </WithReceipt>
      </$Footer>
    </>
  );
};
const $StatusCard = styled.div<{ active?: boolean }>`
  ${layoutMixins.spacedRow}
  gap: 1rem;
  background-color: var(--color-layer-4);
  padding: 1rem;
  border: var(--border);
  border-radius: 0.625rem;

  ${({ active }) =>
    active &&
    css`
      background-color: var(--color-layer-5);
    `}
  > div {
    ${layoutMixins.column}
    gap: 0.25rem;

    h3 {
      color: var(--color-text-2);
      font: var(--font-base-book);
    }

    p {
      color: var(--color-text-0);
      font: var(--font-small-medium);
    }
  }
`;

const $Footer = styled.footer`
  ${layoutMixins.stickyFooter}
  margin-top: auto;

  display: grid;
  gap: 1rem;
`;
