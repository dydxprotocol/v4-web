import styled, { css } from 'styled-components';

import { EvmDerivedAccountStatus } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { WalletType } from '@/constants/wallets';

import { useGenerateKeys } from '@/hooks/Onboarding/useGenerateKeys';
import { useAccounts } from '@/hooks/useAccounts';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { WithReceipt } from '@/components/WithReceipt';

import { isTruthy } from '@/lib/isTruthy';

type ElementProps = {
  status: EvmDerivedAccountStatus;
  setStatus: (status: EvmDerivedAccountStatus) => void;
  onKeysDerived?: () => void;
};

export const GenerateKeys = ({ status, setStatus, onKeysDerived = () => {} }: ElementProps) => {
  const stringGetter = useStringGetter();
  const isSimpleUi = useSimpleUiEnabled();
  const { sourceAccount } = useAccounts();

  const {
    error,
    isDeriving,
    isMatchingNetwork,
    isSwitchingNetwork,
    onClickSwitchNetwork,
    onClickSendRequestOrTryAgain,
  } = useGenerateKeys({
    status,
    setStatus,
    onKeysDerived,
  });

  return (
    <>
      <div tw="grid gap-1">
        {[
          {
            status: EvmDerivedAccountStatus.Deriving,
            title: isSimpleUi
              ? stringGetter({ key: STRING_KEYS.VERIFY_YOUR_DYDX_WALLET })
              : stringGetter({ key: STRING_KEYS.GENERATE_DYDX_WALLET }),
            pendingTitle: stringGetter({ key: STRING_KEYS.VERIFYING_YOUR_DYDX_WALLET }),
            description: stringGetter({ key: STRING_KEYS.VERIFY_WALLET_OWNERSHIP }),
          },
          status === EvmDerivedAccountStatus.EnsuringDeterminism && {
            status: EvmDerivedAccountStatus.EnsuringDeterminism,
            title: stringGetter({ key: STRING_KEYS.VERIFY_WALLET_COMPATIBILITY }),
            pendingTitle: stringGetter({ key: STRING_KEYS.VERIFYING_WALLET_COMPATIBILITY }),
            description: stringGetter({ key: STRING_KEYS.ENSURES_WALLET_SUPPORT }),
          },
        ]
          .filter(isTruthy)
          .map((step) => {
            const isActive = status === step.status;
            return isSimpleUi ? (
              <$SimpleUiStatusCard
                key={step.status}
                active={isActive}
                pending={status < step.status}
              >
                <h3>{isActive ? step.pendingTitle : step.title}</h3>
                {status < step.status ? (
                  <LoadingSpinner disabled size="32" />
                ) : status === step.status ? (
                  <LoadingSpinner size="32" />
                ) : (
                  <GreenCheckCircle tw="[--icon-size:1.25rem]" />
                )}
              </$SimpleUiStatusCard>
            ) : (
              <$StatusCard key={step.status} active={isActive}>
                <div>
                  <h3>{isActive ? step.pendingTitle : step.title}</h3>
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
            );
          })}
      </div>

      <$Footer>
        {error && <AlertMessage type={AlertType.Error}>{error}</AlertMessage>}
        <WithReceipt
          slotReceipt={
            !isSimpleUi && (
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
            )
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

const $SimpleUiStatusCard = styled.div<{ active: boolean; pending: boolean }>`
  ${layoutMixins.spacedRow}
  gap: 0.5rem;
  font: var(--font-small-medium);
  padding: 1rem;
  border-radius: 0.5rem;

  ${({ active, pending }) =>
    active || pending
      ? css`
          background-color: var(--color-layer-2);
          color: var(--color-text-2);
        `
      : css`
          background-color: transparent;
          color: var(--color-text-0);
        `}
`;

const $Footer = styled.footer`
  ${layoutMixins.stickyFooter}
  margin-top: auto;

  display: grid;
  gap: 1rem;
`;
