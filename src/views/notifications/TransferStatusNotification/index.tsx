import { MouseEvent, useCallback, useState } from 'react';

import { log } from 'console';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { SUPPORTED_COSMOS_CHAINS } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { TransferNotifcation, TransferNotificationTypes } from '@/constants/notifications';

import { useInterval } from '@/hooks/useInterval';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Collapsible } from '@/components/Collapsible';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { LoadingDots } from '@/components/Loading/LoadingDots';
// eslint-disable-next-line import/no-cycle
import { Notification, NotificationProps } from '@/components/Notification';
import { Output, OutputType } from '@/components/Output';
import { WithReceipt } from '@/components/WithReceipt';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { formatSeconds } from '@/lib/timeUtils';

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
  transfer,
  type,
  triggeredAt = Date.now(),
}: ElementProps & NotificationProps) => {
  const stringGetter = useStringGetter();
  const [open, setOpen] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const { depositCurrentBalance } = useSubaccount();
  const { addOrUpdateTransferNotification } = useLocalNotifications();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const { status, toAmount, isExchange, fromChainId, toChainId, isSubaccountDepositCompleted } =
    transfer;

  // @ts-ignore status.errors is not in the type definition but can be returned
  const error = status?.errors?.length ? status?.errors[0] : status?.error;
  const hasError = error && Object.keys(error).length !== 0;

  const updateSecondsLeft = useCallback(() => {
    const fromEstimatedRouteDuration = status?.fromChain?.chainData?.estimatedRouteDuration;
    const toEstimatedRouteDuration = status?.toChain?.chainData?.estimatedRouteDuration;
    // TODO: remove typeguards once skip implements estimatedrouteduration
    // https://linear.app/dydx/issue/OTE-475/[web]-migration-followup-estimatedrouteduration
    if (
      typeof fromEstimatedRouteDuration === 'string' ||
      typeof toEstimatedRouteDuration === 'string'
    ) {
      return;
    }
    const fromChainEta = (fromEstimatedRouteDuration ?? 0) * 1000;
    const toChainEta = (toEstimatedRouteDuration ?? 0) * 1000;
    setSecondsLeft(Math.floor((triggeredAt + fromChainEta + toChainEta - Date.now()) / 1000));
  }, [status]);

  useInterval({ callback: updateSecondsLeft });

  const isCosmosDeposit =
    SUPPORTED_COSMOS_CHAINS.includes(fromChainId ?? '') &&
    fromChainId !== selectedDydxChainId &&
    toChainId === selectedDydxChainId;
  const isComplete = isCosmosDeposit
    ? isSubaccountDepositCompleted
    : status?.squidTransactionStatus === 'success' || isExchange;

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
      ? isComplete
        ? STRING_KEYS.DEPOSIT_COMPLETE
        : inProgressStatusString
      : isComplete
        ? STRING_KEYS.WITHDRAW_COMPLETE
        : inProgressStatusString;

  const detailItems = [
    {
      key: 'amount',
      label: 'Amount',
      value: <$InlineOutput type={OutputType.Fiat} value={toAmount} />,
    },
    {
      key: 'status',
      label: 'Status',
      value: isComplete
        ? stringGetter({ key: STRING_KEYS.CONFIRMED })
        : stringGetter({ key: STRING_KEYS.AWAITING_CONFIRMATION }),
    },
  ];

  const subaccountDeposit = useCallback(async () => {
    try {
      await depositCurrentBalance();
      addOrUpdateTransferNotification({
        ...transfer,
        isSubaccountDepositCompleted: true,
      });
    } catch (e) {
      log('TransferStatusNotification/subaccountDeposit', e);
    }
  }, [addOrUpdateTransferNotification, depositCurrentBalance, transfer]);

  const content = (
    <div tw="flexColumn gap-0.5">
      {isCosmosDeposit ? (
        <>
          <$Details items={detailItems} />
          {!isToast && !isComplete && (
            <Button
              action={ButtonAction.Primary}
              type={ButtonType.Button}
              size={ButtonSize.Small}
              onClick={subaccountDeposit}
            >
              {stringGetter({ key: STRING_KEYS.CONFIRM_DEPOSIT })}
            </Button>
          )}
        </>
      ) : (
        <>
          <$Status>
            {stringGetter({
              key: statusString,
              params: {
                AMOUNT_USD: <$InlineOutput type={OutputType.Fiat} value={toAmount} />,
                ESTIMATED_DURATION: (
                  <$InlineOutput
                    type={OutputType.Text}
                    value={formatSeconds(Math.max(secondsLeft || 0, 0))}
                  />
                ),
              },
            })}
          </$Status>
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
      )}
      <div>{stringGetter({ key: STRING_KEYS.KEEP_WINDOW_OPEN })}</div>
      {!isToast && !isComplete && !hasError && !isCosmosDeposit && (
        <TransferStatusSteps status={status} type={type} tw="px-0 pb-0 pt-0.5" />
      )}
    </div>
  );

  const transferIcon = isCosmosDeposit ? slotIcon : isToast && slotIcon;

  const transferNotif = (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={transferIcon}
      slotTitle={slotTitle}
      slotCustomContent={
        <div tw="flexColumn gap-0.5">
          {!status && !isExchange && !isCosmosDeposit ? (
            <>
              {!isComplete && <div>{stringGetter({ key: STRING_KEYS.KEEP_WINDOW_OPEN })}</div>}
              <div>
                <LoadingDots size={3} />
              </div>
            </>
          ) : (
            content
          )}
        </div>
      }
      slotAction={
        isToast &&
        !isCosmosDeposit &&
        status && (
          <$Trigger
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
          </$Trigger>
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
          <div tw="px-1 py-0">
            <TransferStatusSteps status={status} type={type} />
          </div>
        </Collapsible>
      }
    >
      {transferNotif}
    </WithReceipt>
  ) : (
    transferNotif
  );
};
const $Status = styled.div<{ withMarginBottom?: boolean }>`
  color: var(--color-text-0);
  font-size: 0.875rem;

  ${({ withMarginBottom }) =>
    withMarginBottom &&
    css`
      margin-bottom: 0.5rem;
    `}
`;

const $InlineOutput = tw(Output)`inline-block text-color-text-1`;
const $Trigger = styled.button<{ isOpen?: boolean }>`
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

const $Details = styled(Details)`
  --details-item-vertical-padding: 0.2rem;

  dd {
    color: var(--color-text-2);
  }
`;
