import { useCallback, useEffect, useState } from 'react';

import { Description } from '@radix-ui/react-dialog';
import styled from 'styled-components';

import { AMOUNT_RESERVED_FOR_GAS_NOBLE } from '@/constants/account';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { TransferNotificationTypes } from '@/constants/notifications';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

import { track } from '@/lib/analytics';
import { getNobleChainId } from '@/lib/squid';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
  toAmount?: number;
  txHash: string;
  fromChainId?: string;
};

export const CosmosDepositDialog = ({ setIsOpen, toAmount, txHash, fromChainId }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { isMobile } = useBreakpoints();
  const { deposit } = useSubaccount();
  const { setAllTransferNotifications } = useLocalNotifications();
  const { dydxAddress } = useAccounts();

  const [txStatus, setTxStatus] = useState<'success' | 'error' | 'pending'>('pending');

  const depositToSubaccount = useCallback(async () => {
    try {
      if (toAmount && dydxAddress && txHash) {
        const amount =
          toAmount > AMOUNT_RESERVED_FOR_GAS_NOBLE
            ? toAmount - AMOUNT_RESERVED_FOR_GAS_NOBLE
            : toAmount;
        const tx = await deposit(amount);

        if (tx !== undefined) {
          const depositTxHash = Buffer.from(tx.hash).toString('hex');

          setAllTransferNotifications((transferNotification) => {
            return {
              ...transferNotification,
              [dydxAddress]: transferNotification[dydxAddress].map((notification) => {
                if (notification.txHash === txHash) {
                  return {
                    ...notification,
                    depositSubaccount: {
                      txHash: depositTxHash,
                      needToDeposit: false,
                    },
                  };
                }
                return notification;
              }),
            };
          });
          track(
            AnalyticsEvents.TransferNotification({
              triggeredAt: undefined,
              timeSpent: undefined,
              txHash,
              toAmount,
              type: TransferNotificationTypes.Deposit,
              status: 'success',
            })
          );

          setTxStatus('success');
        } else {
          throw new Error('Transaction failed');
        }
      }
    } catch (e) {
      setTxStatus('error');
    }
  }, [dydxAddress, setAllTransferNotifications, toAmount, txHash]);

  useEffect(() => {
    if (txStatus === 'pending') {
      depositToSubaccount();
    }
  }, [depositToSubaccount, txStatus]);

  const onRetry = () => {
    setTxStatus('pending');
  };

  const onClose = () => {
    setIsOpen?.(false);
  };

  const nobleChainId = getNobleChainId();
  const chainName = fromChainId === nobleChainId ? 'Noble' : 'Osmosis';

  const stepItems = [
    {
      step: 1,
      // TODO: Need to add localization
      title: 'Send USDC',
      // TODO: Need to add localization
      description: `Send IBC from ${chainName}.`,
    },
    {
      step: 2,
      // TODO: Need to add localization
      title: 'Confirm Deposit',
      // TODO: Need to add localization
      description: 'Fund your dYdX subaccount balance once your IBC transfer has been received.',
    },
  ];

  const isDepositSuccess = txStatus === 'success';
  const isDepositError = txStatus === 'error';
  const isDepositPending = txStatus === 'pending';

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DEPOSIT })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <$Content>
        {stepItems.map((stepItem, index) => (
          <$StepItemContainer key={stepItem.step}>
            <$StepItem>
              <$Icon>
                {index > 0 && isDepositPending && <$LoadingSpinner />}
                {(index === 0 || isDepositSuccess) && <$GreenCheckCircle />}
                {index > 0 && isDepositError && <$WarningIcon iconName={IconName.Warning} />}
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
          action={isDepositSuccess ? ButtonAction.Primary : ButtonAction.Secondary}
          disabled={isDepositPending}
          type={ButtonType.Button}
          onClick={isDepositSuccess ? onClose : onRetry}
        >
          {/* TODO: Need to add localization */}
          {isDepositError ? 'Try Again' : txStatus === 'success' ? 'Done' : 'Deposit'}
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
