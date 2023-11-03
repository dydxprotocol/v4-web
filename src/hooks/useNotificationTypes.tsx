import { type ReactNode, useCallback, useEffect } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { TESTNET_CHAIN_ID } from '@dydxprotocol/v4-client-js';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS, type StringGetterFunction, StringKey } from '@/constants/localization';
import { type NotificationTypeConfig, NotificationType } from '@/constants/notifications';

import { useLocalNotifications } from '@/hooks/useLocalNotifications';

import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { TransferStatusToast } from '@/views/notifications/TransferStatusNotification';
import { TransferStatusSteps } from '@/views/TransferStatusSteps';

import { getAbacusNotifications } from '@/state/notificationsSelectors';

import { useStringGetter } from './useStringGetter';

const STRING_VALUES = Object.fromEntries(Object.values(STRING_KEYS).map((key) => [key, key]));

const parseStringParamsForNotification = ({
  stringGetter,
  value,
}: {
  stringGetter: StringGetterFunction;
  value: unknown;
}): ReactNode => {
  if (STRING_VALUES[value as StringKey]) {
    return stringGetter({ key: value as StringKey });
  }

  return value as ReactNode;
};

export const notificationTypes: NotificationTypeConfig[] = [
  {
    type: NotificationType.OrderStatusChanged,

    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const abacusNotifications = useSelector(getAbacusNotifications, isEqual);

      useEffect(() => {
        for (const notification of abacusNotifications) {
          const abacusNotificationType = notification.id.split(':')[0];

          const parsedData = notification.data ? JSON.parse(notification.data) : {};

          const params = Object.fromEntries(
            Object.entries(parsedData).map(([key, value]) => {
              return [key, parseStringParamsForNotification({ stringGetter, value })];
            })
          );

          switch (abacusNotificationType) {
            case 'order': {
              trigger(
                notification.id,
                {
                  icon: notification.image && <Styled.Icon src={notification.image} alt="" />,
                  title: stringGetter({ key: notification.title }),
                  body: notification.text ? stringGetter({ key: notification.text, params }) : '',
                  toastSensitivity: 'foreground',
                },
                [notification.updateTimeInMilliseconds, notification.data],
                true
              );
              break;
            }
            default:
              trigger(
                notification.id,
                {
                  icon: notification.image && <Styled.Icon src={notification.image} alt="" />,
                  title: stringGetter({ key: notification.title }),
                  body: notification.text ? stringGetter({ key: notification.text, params }) : '',
                  toastSensitivity: 'foreground',
                },
                [notification.updateTimeInMilliseconds, notification.data],
                true
              );
              break;
          }
        }
      }, [abacusNotifications]);
    },
  },
  {
    type: NotificationType.SquidTransfer,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const { transferNotifications } = useLocalNotifications();

      const getTitleStringKey = useCallback((type: 'deposit' | 'withdrawal', finished: boolean) => {
        if (type === 'deposit' && !finished) return STRING_KEYS.DEPOSIT_IN_PROGRESS;
        if (type === 'deposit' && finished) return STRING_KEYS.DEPOSIT;
        if (type === 'withdrawal' && !finished) return STRING_KEYS.WITHDRAW_IN_PROGRESS;
        return STRING_KEYS.WITHDRAW;
      }, []);

      useEffect(() => {
        for (const transfer of transferNotifications) {
          const { fromChainId, status, txHash, toAmount } = transfer;
          const finished = Boolean(status) && status?.squidTransactionStatus !== 'ongoing';
          const type = fromChainId === TESTNET_CHAIN_ID ? 'withdrawal' : 'deposit';
          // @ts-ignore status.errors is not in the type definition but can be returned
          const error = status?.errors?.length ? status?.errors[0] : status?.error;

          trigger(
            txHash,
            {
              icon: <Icon iconName={finished ? IconName.Transfer : IconName.Clock} />,
              title: stringGetter({ key: getTitleStringKey(type, finished) }),
              body: `${type === 'deposit' ? 'Deposit of' : 'Withdraw of'} ${toAmount}`,
              customBody: (
                <TransferStatusToast
                  type={type}
                  toAmount={transfer.toAmount}
                  triggeredAt={transfer.triggeredAt}
                  status={transfer.status}
                />
              ),
              customMenuContent: !finished && (
                <div>
                  <div>
                    <Styled.TransferText>
                      {type === 'deposit' ? 'Deposit of ' : 'Withdraw of '}
                      <Output type={OutputType.Fiat} value={toAmount} />
                    </Styled.TransferText>

                    {error && (
                      <Styled.ErrorMessage type={AlertType.Error}>
                        {stringGetter({
                          key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
                          params: {
                            ERROR_MESSAGE:
                              error.message || stringGetter({ key: STRING_KEYS.UNKNOWN_ERROR }),
                          },
                        })}
                      </Styled.ErrorMessage>
                    )}
                  </div>
                  <TransferStatusSteps status={transfer.status} type={type} />
                </div>
              ),
              toastSensitivity: 'foreground',
            },
            []
          );
        }
      }, [transferNotifications]);
    },
  },
];

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Icon = styled.img`
  height: 1.5rem;
  width: 1.5rem;
`;

Styled.TransferText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5ch;
`;

Styled.ErrorMessage = styled.div`
  max-width: 13rem;
`;
