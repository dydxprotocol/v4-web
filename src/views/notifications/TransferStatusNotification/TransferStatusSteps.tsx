import { useMemo } from 'react';

import { StatusResponse } from '@0xsquid/sdk';
import { useSelector } from 'react-redux';
import styled, { css, type AnyStyledComponent } from 'styled-components';

import { AnalyticsEvent } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { TransferNotificationTypes } from '@/constants/notifications';

import { useStringGetter, useURLConfigs } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingDots } from '@/components/Loading/LoadingDots';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

import { getSelectedDydxChainId } from '@/state/appSelectors';

import { track } from '@/lib/analytics';

type ElementProps = {
  status?: StatusResponse;
  type: TransferNotificationTypes;
  toAmount: number | undefined;
};

type StyleProps = {
  className?: string;
};

enum TransferStatusStep {
  FromChain,
  Bridge,
  ToChain,
  Complete,
}

const shouldTrackTxLinkExistence = (
  currentStep: TransferStatusStep,
  type: TransferNotificationTypes
) => {
  if (type === TransferNotificationTypes.Deposit) {
    return currentStep === TransferStatusStep.FromChain;
  }
  if (type === TransferNotificationTypes.Withdrawal) {
    return currentStep === TransferStatusStep.ToChain;
  }
  return false;
};

export const TransferStatusSteps = ({
  className,
  status,
  type,
  toAmount,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const selectedDydxChainId = useSelector(getSelectedDydxChainId);
  const { mintscan: mintscanTxUrl } = useURLConfigs();

  const { currentStep, steps } = useMemo(() => {
    const routeStatus = status?.routeStatus;
    const fromChain = status?.fromChain?.chainData?.chainId;
    const toChain = status?.toChain?.chainData?.chainId;

    const currentStatus = routeStatus?.[routeStatus?.length - 1];

    const steps = [
      {
        label: stringGetter({
          key:
            type === TransferNotificationTypes.Deposit
              ? STRING_KEYS.INITIATED_DEPOSIT
              : STRING_KEYS.INITIATED_WITHDRAWAL,
        }),
        step: TransferStatusStep.FromChain,
        link:
          type === TransferNotificationTypes.Deposit
            ? status?.fromChain?.transactionUrl
            : routeStatus?.[0]?.chainId === selectedDydxChainId && routeStatus[0].txHash
            ? `${mintscanTxUrl?.replace('{tx_hash}', routeStatus[0].txHash.replace('0x', ''))}`
            : undefined,
      },
      {
        label: stringGetter({ key: STRING_KEYS.BRIDGING_TOKENS }),
        step: TransferStatusStep.Bridge,
        link: status?.axelarTransactionUrl,
      },
      {
        label: stringGetter({
          key:
            type === TransferNotificationTypes.Deposit
              ? STRING_KEYS.DEPOSIT_TO_CHAIN
              : STRING_KEYS.WITHDRAW_TO_CHAIN,
          params: {
            CHAIN:
              type === TransferNotificationTypes.Deposit
                ? 'dYdX'
                : status?.toChain?.chainData?.chainName,
          },
        }),
        step: TransferStatusStep.ToChain,
        link:
          type === TransferNotificationTypes.Withdrawal
            ? status?.toChain?.transactionUrl
            : currentStatus?.chainId === selectedDydxChainId && currentStatus?.txHash
            ? `${mintscanTxUrl?.replace('{tx_hash}', currentStatus.txHash.replace('0x', ''))}`
            : undefined,
      },
    ];

    let currentStep = TransferStatusStep.Bridge;

    if (!routeStatus?.length) {
      currentStep = TransferStatusStep.FromChain;
    } else if (currentStatus.chainId === toChain) {
      currentStep =
        currentStatus.status !== 'success'
          ? TransferStatusStep.ToChain
          : TransferStatusStep.Complete;
    } else if (currentStatus.chainId === fromChain && currentStatus.status !== 'success') {
      currentStep = TransferStatusStep.FromChain;
    }

    if (status?.squidTransactionStatus === 'success') {
      currentStep = TransferStatusStep.Complete;
    }
    track(AnalyticsEvent.TransferStep, {
      step: TransferStatusStep[currentStep],
      type,
      link: steps.find(({ step }) => step === currentStep)?.link,
      amount: toAmount,
      time: status?.timeSpent,
    });
    return {
      currentStep,
      steps,
      type,
    };
  }, [status, stringGetter]);

  if (!status) return <LoadingDots size={3} />;

  return (
    <Styled.BridgingStatus className={className}>
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
              <Styled.Label highlighted={currentStep >= step.step}>{step.label}</Styled.Label>
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
        color: var(--color-success);
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
