import { useMemo } from 'react';
import styled, { css, keyframes, type AnyStyledComponent } from 'styled-components';
import { StatusResponse } from '@0xsquid/sdk';
import { TESTNET_CHAIN_ID } from '@dydxprotocol/v4-client';

import { useStringGetter } from '@/hooks';

import { Link } from '@/components/Link';
import { Icon, IconName } from '@/components/Icon';
import { LoadingDots } from '@/components/Loading/LoadingDots';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

import { layoutMixins } from '@/styles/layoutMixins';
import { STRING_KEYS } from '@/constants/localization';

type ElementProps = {
  status?: StatusResponse;
};

enum TransferStatusStep {
  FromChain,
  Bridge,
  ToChain,
  Complete,
}

export const TransferStatusSteps = ({ status }: ElementProps) => {
  const stringGetter = useStringGetter();

  const type = useMemo(
    () => (status?.toChain?.chainData.chainId === TESTNET_CHAIN_ID ? 'deposit' : 'withdrawal'),
    [status]
  );

  const currentStep = useMemo(() => {
    const routeStatus = status?.routeStatus;
    const fromChain = status?.fromChain?.chainData.chainId;
    const toChain = status?.toChain?.chainData.chainId;

    if (!routeStatus?.length) return TransferStatusStep.FromChain;

    const currentStatus = routeStatus[routeStatus?.length - 1];

    if (currentStatus.chainId === toChain) {
      return currentStatus.status !== 'success'
        ? TransferStatusStep.ToChain
        : TransferStatusStep.Complete;
    }

    if (currentStatus.chainId === fromChain && currentStatus.status !== 'success') {
      return TransferStatusStep.FromChain;
    }

    return TransferStatusStep.Bridge;
  }, [status]);

  const steps = useMemo(
    () => [
      {
        label: stringGetter({
          key: type === 'deposit' ? STRING_KEYS.INITIATED_DEPOSIT : STRING_KEYS.INITIATED_WITHDRAWAL,
        }),
        step: TransferStatusStep.FromChain,
        link: status?.fromChain?.transactionUrl,
      },
      {
        label: 'Bridging tokens',
        step: TransferStatusStep.Bridge,
        link: status?.axelarTransactionUrl,
      },
      {
        label: stringGetter({
          key: type === 'deposit' ? STRING_KEYS.DEPOSIT_TO_CHAIN : STRING_KEYS.WITHDRAW_TO_CHAIN,
          params: {
            CHAIN: status?.toChain?.chainData.chainName,
          }
        }),
        step: TransferStatusStep.ToChain,
        link: status?.toChain?.transactionUrl,
      },
    ],
    [status]
  );

  if (!status) return <LoadingDots size={3} />;

  return (
    <Styled.BridgingStatus>
      {steps.map((step) => (
        <Styled.Step key={step.step}>
          <Styled.row>
            {step.step === currentStep ? (
              <Styled.Icon>
                <Styled.Spinner />
              </Styled.Icon>
            ) : step.step < currentStep ? (
              <Styled.Icon state="complete">
                <Icon iconName={IconName.Check} />
              </Styled.Icon>
            ) : (
              <Styled.Icon state="default">{step.step + 1}</Styled.Icon>
            )}
            {step.link && currentStep >= step.step ? (
              <Link href={step.link}>
                <Styled.Label highlighted={currentStep >= step.step}>
                  {step.label}
                  <Icon iconName={IconName.LinkOut} />
                </Styled.Label>
              </Link>
            ) : (
              <Styled.Label highlighted={currentStep >= step.step}>
                {step.label}
              </Styled.Label>
            )}
          </Styled.row>
        </Styled.Step>
      ))}
    </Styled.BridgingStatus>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.BridgingStatus = styled.div`
  ${layoutMixins.flexColumn};

  gap: 1rem;
  padding: 1rem 0;
`;

Styled.Step = styled.div`
  ${layoutMixins.spacedRow};
`;

Styled.row = styled.div`
  ${layoutMixins.inlineRow};
  gap: 0.5rem;
`;

Styled.Icon = styled.div<{ state: 'complete' | 'default' }>`
  display: flex;
  align-items: center;
  justify-content: center;

  height: 2rem;
  width: 2rem;

  border-radius: 50%;

  background-color: var(--color-layer-3);

  ${({ state }) =>
    ({
      ['complete']: css`
        color: var(--color-positive);
      `,
      ['default']: css`
        color: var(--color-text-0);
      `,
    }[state])}
`;

Styled.Spinner = styled(LoadingSpinner)`
  --spinner-width: 1.25rem;

  color: var(--color-accent);
`;

Styled.Label = styled(Styled.row)<{ highlighted?: boolean }>`
  ${({ highlighted }) =>
    highlighted
      ? css`
          color: var(--color-text-2);
        `
      : css`
          color: var(--color-text-0);
        `}
`;
