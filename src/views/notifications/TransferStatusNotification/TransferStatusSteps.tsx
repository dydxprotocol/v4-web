import { useMemo } from 'react';

import { StatusResponse } from '@0xsquid/sdk';
import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { TransferNotificationTypes } from '@/constants/notifications';
import { SkipStatusResponse } from '@/constants/skip';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingDots } from '@/components/Loading/LoadingDots';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

type ElementProps = {
  status?: StatusResponse | SkipStatusResponse;
  type: TransferNotificationTypes;
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

export const TransferStatusSteps = ({ className, status, type }: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { mintscan: mintscanTxUrl } = useURLConfigs();
  const { chainTokenLabel } = useTokenConfigs();

  const { currentStep, steps } = useMemo(() => {
    const routeStatus = status?.routeStatus;
    const fromChain = status?.fromChain?.chainData?.chainId;
    const toChain = status?.toChain?.chainData?.chainId;

    const currentStatus =
      routeStatus != null && routeStatus.length != null
        ? routeStatus[routeStatus.length - 1]
        : undefined;

    const newSteps = [
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
                ? chainTokenLabel
                : status?.toChain?.chainData?.chainName ?? '...',
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

    let newCurrentStep = TransferStatusStep.Bridge;

    if (!routeStatus?.length) {
      newCurrentStep = TransferStatusStep.FromChain;
    } else if (currentStatus.chainId === toChain) {
      newCurrentStep =
        currentStatus.status !== 'success'
          ? TransferStatusStep.ToChain
          : TransferStatusStep.Complete;
    } else if (currentStatus.chainId === fromChain && currentStatus.status !== 'success') {
      newCurrentStep = TransferStatusStep.FromChain;
    }

    if (status?.squidTransactionStatus === 'success') {
      newCurrentStep = TransferStatusStep.Complete;
    }

    return {
      currentStep: newCurrentStep,
      steps: newSteps,
      type,
    };
  }, [status, stringGetter]);

  if (!status) return <LoadingDots size={3} />;

  return (
    <$BridgingStatus className={className}>
      {steps.map((step) => (
        <$Step key={step.step}>
          <$row>
            {step.step === currentStep ? (
              <$Icon>
                <$Spinner />
              </$Icon>
            ) : step.step < currentStep ? (
              <$Icon state="complete">
                <Icon iconName={IconName.Check} />
              </$Icon>
            ) : (
              <$Icon state="default">{step.step + 1}</$Icon>
            )}
            {step.link && currentStep >= step.step ? (
              <Link href={step.link}>
                <$Label highlighted={currentStep >= step.step}>
                  {step.label}
                  <Icon iconName={IconName.LinkOut} />
                </$Label>
              </Link>
            ) : (
              <$Label highlighted={currentStep >= step.step}>{step.label}</$Label>
            )}
          </$row>
        </$Step>
      ))}
    </$BridgingStatus>
  );
};
const $BridgingStatus = styled.div`
  ${layoutMixins.flexColumn};

  gap: 1rem;
  padding: 1rem 0;
`;

const $Step = styled.div`
  ${layoutMixins.spacedRow};
`;

const $row = styled.div`
  ${layoutMixins.inlineRow};
  gap: 0.5rem;
`;

const $Icon = styled.div<{ state?: 'complete' | 'default' }>`
  display: flex;
  align-items: center;
  justify-content: center;

  height: 2rem;
  width: 2rem;

  border-radius: 50%;

  background-color: var(--color-layer-3);

  ${({ state }) =>
    state == null
      ? undefined
      : {
          complete: css`
            color: var(--color-success);
          `,
          default: css`
            color: var(--color-text-0);
          `,
        }[state]}
`;

const $Spinner = styled(LoadingSpinner)`
  --spinner-width: 1.25rem;

  color: var(--color-accent);
`;

const $Label = styled($row)<{ highlighted?: boolean }>`
  ${({ highlighted }) =>
    highlighted
      ? css`
          color: var(--color-text-2);
        `
      : css`
          color: var(--color-text-0);
        `}
`;
