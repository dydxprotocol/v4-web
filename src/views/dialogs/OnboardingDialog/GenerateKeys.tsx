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
import { Switch } from '@/components/Switch';
import { WithReceipt } from '@/components/WithReceipt';
import { WithTooltip } from '@/components/WithTooltip';

import { track } from '@/lib/analytics';
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
  const [shouldRememberMe, setShouldRememberMe] = useState(false);

  const { setWalletFromSignature, saveEvmSignature, saveSolSignature, walletType } = useAccounts();

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
      await matchNetwork?.();
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

  const signMessageAsync = useSignForWalletDerivation(walletType);

  const staticEncryptionKey = import.meta.env.VITE_PK_ENCRYPTION_KEY;

  const deriveKeys = async () => {
    setError(undefined);

    try {
      // 1. First signature
      setStatus(EvmDerivedAccountStatus.Deriving);

      const signature = await signMessageAsync();
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
      if (shouldRememberMe && staticEncryptionKey) {
        const encryptedSignature = AES.encrypt(signature, staticEncryptionKey).toString();

        if (walletType === WalletType.Phantom) {
          saveSolSignature(encryptedSignature);
        } else {
          saveEvmSignature(encryptedSignature);
        }
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

  return (
    <>
      <$StatusCardsContainer>
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
              {status < step.status ? (
                <LoadingSpinner disabled />
              ) : status === step.status ? (
                <LoadingSpinner />
              ) : (
                <$GreenCheckCircle />
              )}
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </$StatusCard>
          ))}
      </$StatusCardsContainer>

      <$Footer>
        <$RememberMe htmlFor="remember-me">
          <WithTooltip withIcon tooltip="remember-me">
            {stringGetter({ key: STRING_KEYS.REMEMBER_ME })}
          </WithTooltip>

          <Switch
            name="remember-me"
            disabled={!staticEncryptionKey || isDeriving}
            checked={shouldRememberMe}
            onCheckedChange={setShouldRememberMe}
          />
        </$RememberMe>
        {error && <AlertMessage type={AlertType.Error}>{error}</AlertMessage>}
        <$WithReceipt
          slotReceipt={
            <$ReceiptArea>
              <span>
                {stringGetter({
                  key: STRING_KEYS.FREE_SIGNING,
                  params: {
                    FREE: (
                      <$Green>
                        {stringGetter({ key: STRING_KEYS.FREE_TRADING_TITLE_ASTERISK_FREE })}
                      </$Green>
                    ),
                  },
                })}
              </span>
            </$ReceiptArea>
          }
        >
          {!isMatchingNetwork && walletType !== WalletType.Phantom ? (
            <Button
              action={ButtonAction.Primary}
              onClick={() => switchNetworkAndDeriveKeys().then(onKeysDerived)}
              state={{ isLoading: isSwitchingNetwork }}
            >
              {stringGetter({ key: STRING_KEYS.SWITCH_NETWORK })}
            </Button>
          ) : (
            <Button
              action={ButtonAction.Primary}
              onClick={() => deriveKeys().then(onKeysDerived)}
              state={{
                isLoading: isDeriving,
                isDisabled: status !== EvmDerivedAccountStatus.NotDerived,
              }}
            >
              {!error
                ? stringGetter({
                    key: STRING_KEYS.SEND_REQUEST,
                  })
                : stringGetter({
                    key: STRING_KEYS.TRY_AGAIN,
                  })}
            </Button>
          )}
        </$WithReceipt>
        <$Disclaimer>{stringGetter({ key: STRING_KEYS.CHECK_WALLET_FOR_REQUEST })}</$Disclaimer>
      </$Footer>
    </>
  );
};
const $StatusCardsContainer = styled.div`
  display: grid;
  gap: 1rem;
`;

const $StatusCard = styled.div<{ active?: boolean }>`
  ${layoutMixins.row}
  gap: 1rem;
  background-color: var(--color-layer-4);
  padding: 1rem;
  border-radius: 0.625rem;

  ${({ active }) =>
    active &&
    css`
      background-color: var(--color-layer-6);
    `}
  > div {
    ${layoutMixins.column}
    gap: 0.25rem;

    h3 {
      color: var(--color-text-2);
      font: var(--font-base-book);
    }

    p {
      color: var(--color-text-1);
      font: var(--font-small-regular);
    }
  }
`;

const $Footer = styled.footer`
  ${layoutMixins.stickyFooter}
  margin-top: auto;

  display: grid;
  gap: 1rem;
`;

const $RememberMe = styled.label`
  ${layoutMixins.spacedRow}
  font: var(--font-base-book);
`;

const $WithReceipt = styled(WithReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

const $ReceiptArea = styled.div`
  padding: 1rem;
  font: var(--font-small-book);
  color: var(--color-text-0);
`;

const $Green = styled.span`
  color: var(--color-green);
`;

const $GreenCheckCircle = styled(GreenCheckCircle)`
  --icon-size: 2.375rem;
`;

const $Disclaimer = styled.span`
  text-align: center;
  color: var(--color-text-0);
  font: var(--font-base-book);
`;
