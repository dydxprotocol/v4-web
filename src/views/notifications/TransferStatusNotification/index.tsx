import { useCallback, useState, useMemo, MouseEvent } from 'react';
import styled, { css, type AnyStyledComponent } from 'styled-components';

import { useInterval, useStringGetter } from '@/hooks';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';
import { TransferNotifcation, TransferNotificationTypes } from '@/constants/notifications';

import { formatSeconds } from '@/lib/timeUtils';

import { AlertMessage } from '@/components/AlertMessage';
import { Collapsible } from '@/components/Collapsible';
import { Icon, IconName } from '@/components/Icon';
import { LoadingDots } from '@/components/Loading/LoadingDots';
import { Notification, NotificationProps } from '@/components/Notification';
import { Output, OutputType } from '@/components/Output';
import { WithReceipt } from '@/components/WithReceipt';

import { layoutMixins } from '@/styles/layoutMixins';

import { TransferStatusSteps } from './TransferStatusSteps';

type ElementProps = {
  type: TransferNotificationTypes;
  transfer: TransferNotifcation;
  triggeredAt?: number;
};

export const TransferStatusNotification = ({
  isToast,
  notification,
  slotIcon,
  slotTitle,
  slotDescription,
  transfer,
  type,
  triggeredAt = Date.now(),
}: ElementProps & NotificationProps) => {
  const stringGetter = useStringGetter();
  const [open, setOpen] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const { fromChainId, status, txHash, toAmount } = transfer;

  // @ts-ignore status.errors is not in the type definition but can be returned
  const error = status?.errors?.length ? status?.errors[0] : status?.error;
  const hasError = error && Object.keys(error).length !== 0;

  const updateSecondsLeft = useCallback(() => {
    const fromChainEta = (status?.fromChain?.chainData?.estimatedRouteDuration || 0) * 1000;
    const toChainEta = (status?.toChain?.chainData?.estimatedRouteDuration || 0) * 1000;
    setSecondsLeft(Math.floor((triggeredAt + fromChainEta + toChainEta - Date.now()) / 1000));
  }, [status]);

  useInterval({ callback: updateSecondsLeft });

  const inProgressStatusString =
    type === TransferNotificationTypes.Deposit
      ? secondsLeft > 0
        ? STRING_KEYS.DEPOSIT_STATUS
        : STRING_KEYS.DEPOSIT_STATUS_SHORTLY
      : secondsLeft > 0
      ? STRING_KEYS.WITHDRAW_STATUS
      : STRING_KEYS.WITHDRAW_STATUS_SHORTLY;

  const statusString =
    type === TransferNotificationTypes.Deposit
      ? status?.squidTransactionStatus === 'success'
        ? STRING_KEYS.DEPOSIT_COMPLETE
        : inProgressStatusString
      : status?.squidTransactionStatus === 'success'
      ? STRING_KEYS.WITHDRAW_COMPLETE
      : inProgressStatusString;

  const content = (
    <>
      <Styled.Status>
        {stringGetter({
          key: statusString,
          params: {
            AMOUNT_USD: <Styled.InlineOutput type={OutputType.Fiat} value={toAmount} />,
            ESTIMATED_DURATION: (
              <Styled.InlineOutput
                type={OutputType.Text}
                value={formatSeconds(Math.max(secondsLeft || 0, 0))}
              />
            ),
          },
        })}
      </Styled.Status>
      {hasError && (
        <AlertMessage type={AlertType.Error}>
          {stringGetter({
            key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
            params: {
              ERROR_MESSAGE: error.message || stringGetter({ key: STRING_KEYS.UNKNOWN_ERROR }),
            },
          })}
        </AlertMessage>
      )}
    </>
  );

  const transferNotif = (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={isToast && slotIcon}
      slotTitle={slotTitle}
      slotCustomContent={
        !status ? (
          <LoadingDots size={3} />
        ) : (
          <Styled.BridgingStatus>
            {content}
            {!isToast && status?.squidTransactionStatus !== 'success' && !hasError && (
              <Styled.TransferStatusSteps status={status} type={type} />
            )}
          </Styled.BridgingStatus>
        )
      }
      slotAction={
        isToast &&
        status && (
          <Styled.Trigger
            isOpen={open}
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            <Icon iconName={IconName.Caret} />{' '}
            {stringGetter({
              key: open ? STRING_KEYS.HIDE_DETAILS : STRING_KEYS.VIEW_DETAILS,
            })}
          </Styled.Trigger>
        )
      }
      withClose={false}
    />
  );

  return isToast ? (
    <WithReceipt
      hideReceipt={!open}
      side="bottom"
      slotReceipt={
        <Collapsible open={open} onOpenChange={setOpen} label="" withTrigger={false}>
          <Styled.Receipt>
            <TransferStatusSteps status={status} type={type} />
          </Styled.Receipt>
        </Collapsible>
      }
    >
      {transferNotif}
    </WithReceipt>
  ) : (
    transferNotif
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.BridgingStatus = styled.div`
  ${layoutMixins.flexColumn};
  gap: 0.5rem;
`;

Styled.Status = styled.div<{ withMarginBottom?: boolean }>`
  color: var(--color-text-0);
  font-size: 0.875rem;

  ${({ withMarginBottom }) =>
    withMarginBottom &&
    css`
      margin-bottom: 0.5rem;
    `}
`;

Styled.InlineOutput = styled(Output)`
  display: inline-block;

  color: var(--color-text-1);
`;

Styled.Step = styled.div`
  ${layoutMixins.row};

  gap: 0.5rem;
`;

Styled.TransferStatusSteps = styled(TransferStatusSteps)`
  padding: 0.5rem 0 0;
`;

Styled.Trigger = styled.button<{ isOpen?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5em;

  color: var(--color-accent);
  user-select: none;
  cursor: pointer;

  &:focus-visible {
    outline: none;
    text-decoration: underline;
  }

  svg {
    transition: rotate 0.3s var(--ease-out-expo);
  }

  ${({ isOpen }) =>
    isOpen &&
    css`
      & > svg {
        rotate: -0.5turn;
      }
    `}
`;

Styled.Receipt = styled.div`
  padding: 0 1rem;
`;
