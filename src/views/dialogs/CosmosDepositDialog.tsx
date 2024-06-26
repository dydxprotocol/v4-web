import { useCallback, useEffect, useState } from 'react';

import { Description } from '@radix-ui/react-dialog';
import Long from 'long';
import styled from 'styled-components';
import { parseUnits } from 'viem';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { TransferNotificationTypes } from '@/constants/notifications';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

import abacusStateManager from '@/lib/abacus';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
  toChainId?: string;
  fromChainId?: string;
  toAmount?: number;
  txHash?: string;
};

export const CosmosDepositDialog = ({
  setIsOpen,
  toChainId,
  fromChainId,
  toAmount,
  txHash,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { usdcGasDenom, usdcDecimals } = useTokenConfigs();
  const { isMobile } = useBreakpoints();
  const { nobleAddress, dydxAddress } = useAccounts();
  const { deposit } = useSubaccount();
  const { transferNotifications, addTransferNotification, setTransferNotifications } =
    useLocalNotifications();

  const [step, setStep] = useState<{
    value: 'ibcTransfer' | 'depositToSubaccount';
    state: 'success' | 'error' | 'pending';
    ibcTransferTxHash?: string;
  }>({
    value: txHash ? 'depositToSubaccount' : 'ibcTransfer',
    state: 'pending',
    ibcTransferTxHash: txHash,
  });

  useEffect(() => {
    setStep((prev) => ({
      ...prev,
      value: txHash ? 'depositToSubaccount' : 'ibcTransfer',
      ibcTransferTxHash: txHash,
    }));
  }, [txHash]);

  const ibcFromNoble = useCallback(async () => {
    try {
      if (nobleAddress && dydxAddress && toAmount) {
        const tx = await abacusStateManager.sendNobleIBC({
          msgTypeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
          msg: {
            sourcePort: 'transfer',
            sourceChannel: isMainnet ? 'channel-33' : 'channel-21',
            sender: nobleAddress,
            receiver: dydxAddress,
            token: {
              denom: usdcGasDenom,
              amount: parseUnits(toAmount.toString(), usdcDecimals).toString(),
            },
            timeoutTimestamp: Long.fromNumber(Math.floor(Date.now() / 1000) * 1e9 + 10 * 60 * 1e9),
          },
        });

        if (tx !== undefined) {
          const parsedTx = JSON.parse(tx);

          if (parsedTx.error !== undefined || parsedTx.code !== 0) {
            throw new Error(parsedTx.error);
          }

          addTransferNotification({
            txHash: parsedTx.transactionHash,
            toChainId,
            fromChainId,
            toAmount,
            triggeredAt: Date.now(),
            type: TransferNotificationTypes.Deposit,
            cosmosTransferStatus: {
              status: 'pending',
              step: 'depositToSubaccount',
            },
          });

          setStep({
            value: 'depositToSubaccount',
            state: 'pending',
            ibcTransferTxHash: parsedTx.transactionHash,
          });
        }
      }
    } catch {
      setStep((prev) => ({ ...prev, state: 'error' }));
    }
  }, [
    nobleAddress,
    dydxAddress,
    toAmount,
    usdcGasDenom,
    usdcDecimals,
    toChainId,
    fromChainId,
    txHash,
  ]);

  const depositToSubaccount = useCallback(async () => {
    try {
      if (toAmount) {
        const tx = await deposit(toAmount);

        if (tx !== undefined) {
          // const txHash = Buffer.from(tx.hash).toString('hex');

          const updatedTransferNotifications = transferNotifications.map((notification) => {
            if (
              notification.txHash === step.ibcTransferTxHash &&
              notification.cosmosTransferStatus !== undefined
            ) {
              return {
                ...notification,
                cosmosTransferStatus: {
                  status: 'success' as const,
                  step: 'depositToSubaccount' as const,
                },
              };
            }
            return notification;
          });
          setTransferNotifications(updatedTransferNotifications);

          setStep((prev) => ({
            ...prev,
            state: 'success',
          }));
        } else {
          throw new Error('Transaction failed');
        }
      }
    } catch {
      setStep((prev) => ({ ...prev, state: 'error' }));
    }
  }, [toAmount, step.ibcTransferTxHash, transferNotifications]);

  useEffect(() => {
    if (step?.state === 'pending' && step.value === 'ibcTransfer') {
      ibcFromNoble();
    }
  }, [step.state, step.value, ibcFromNoble]);

  useEffect(() => {
    if (step?.state === 'pending' && step.value === 'depositToSubaccount') {
      depositToSubaccount();
    }
  }, [step.state, step.value, depositToSubaccount]);

  const onRetry = () => {
    setStep((prev) => ({ ...prev, state: 'pending' }));
  };

  const onClose = () => {
    setIsOpen?.(false);
  };

  const stepItems = [
    {
      step: 1,
      // TODO: Need to add localization
      title: 'Send USDC',
      // TODO: Need to add localization
      description: 'Send IBC from Noble. USDC’s native chain.',
      showStepNumber: false,
      isPending: step?.value === 'ibcTransfer' && step?.state === 'pending',
      isSuccess: step?.value === 'depositToSubaccount',
      isError: step?.value === 'ibcTransfer' && step?.state === 'error',
    },
    {
      step: 2,
      // TODO: Need to add localization
      title: 'Confirm Deposit',
      // TODO: Need to add localization
      description: 'Fund your dYdX subaccount balance once your IBC transfer has been received.',
      showStepNumber: step?.value === 'ibcTransfer',
      isPending: step?.value === 'depositToSubaccount' && step?.state === 'pending',
      isSuccess: step?.value === 'depositToSubaccount' && step?.state === 'success',
      isError: step?.value === 'depositToSubaccount' && step?.state === 'error',
    },
  ];

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <$Content>
        {stepItems.map((stepItem) => (
          <$StepItemContainer key={stepItem.step}>
            <$StepItem>
              <$Icon>
                {stepItem.showStepNumber && <$StepNumber>{stepItem.step}</$StepNumber>}
                {stepItem.isPending && <$LoadingSpinner />}
                {stepItem.isSuccess && <$GreenCheckCircle />}
                {stepItem.isError && <$WarningIcon iconName={IconName.Warning} />}
              </$Icon>
              <div>
                <$Title>{stepItem.title}</$Title>
                <$Description>{stepItem.description}</$Description>
              </div>
            </$StepItem>
            {stepItem.step < stepItems.length && <$VerticalLine />}
          </$StepItemContainer>
        ))}

        <$Button
          action={step?.state === 'success' ? ButtonAction.Primary : ButtonAction.Secondary}
          type={ButtonType.Button}
          disabled={step === undefined || step.state === 'pending'}
          onClick={step?.state === 'error' ? onRetry : onClose}
        >
          {/* TODO: Need to add localization */}
          {step?.state === 'error'
            ? 'Try Again'
            : step?.state === 'success'
              ? 'Done'
              : 'Waiting for Deposit'}
        </$Button>
      </$Content>
    </Dialog>
  );
};

const $Content = styled.div`
  ${layoutMixins.column}
  margin-top: 0.5rem;
`;

const $Icon = styled.div`
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
`;

const $StepItemContainer = styled.div`
  ${layoutMixins.column}
`;

const $StepItem = styled.div`
  ${layoutMixins.row}
  align-items: start;
  gap: 1rem;
`;

const $GreenCheckCircle = styled(GreenCheckCircle)`
  --icon-size: 2rem;
`;

const $WarningIcon = styled(Icon)`
  color: var(--color-warning);
  font-size: 2rem;
`;

const $LoadingSpinner = styled(LoadingSpinner)`
  --spinner-width: 2rem;
`;

const $StepNumber = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--color-layer-5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-2);
  flex-shrink: 0;
`;

const $Title = styled.h3`
  font: var(--font-small-bold);
  color: var(--color-text-2);
  padding-top: 6px;
`;

const $Description = styled(Description)`
  margin-top: 0.5rem;
  color: var(--color-text-0);
  font: var(--font-base-book);
`;

const $VerticalLine = styled.div`
  height: 2rem;
  width: 2px;
  background-color: var(--color-border);
  margin-left: 1rem;
  margin-bottom: 0.5rem;
  margin-top: -0.5rem;
`;

const $Button = styled(Button)`
  margin-top: 2rem;
`;
