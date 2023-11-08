import { type ReactNode, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';

import {
  STRING_KEYS,
  STRING_KEY_VALUES,
  type StringGetterFunction,
  type StringKey,
} from '@/constants/localization';
import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import {
  type NotificationTypeConfig,
  NotificationType,
  DEFAULT_TOAST_AUTO_CLOSE_MS,
} from '@/constants/notifications';
import { DydxChainAsset } from '@/constants/wallets';

import { useSelectedNetwork, useStringGetter } from '@/hooks';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';

import { Icon, IconName } from '@/components/Icon';
import { TradeNotification } from '@/views/notifications/TradeNotification';
import { TransferStatusNotification } from '@/views/notifications/TransferStatusNotification';

import { getAbacusNotifications } from '@/state/notificationsSelectors';

import { formatSeconds } from '@/lib/timeUtils';

const parseStringParamsForNotification = ({
  stringGetter,
  value,
}: {
  stringGetter: StringGetterFunction;
  value: unknown;
}): ReactNode => {
  if (STRING_KEY_VALUES[value as StringKey]) {
    return stringGetter({ key: value as StringKey });
  }

  return value as ReactNode;
};

export const notificationTypes: NotificationTypeConfig[] = [
  {
    type: NotificationType.AbacusGenerated,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const abacusNotifications = useSelector(getAbacusNotifications, isEqual);

      useEffect(() => {
        for (const notification of abacusNotifications) {
          const [abacusNotificationType = ''] = notification.id.split(':');
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
                  icon: notification.image && <$Icon src={notification.image} alt="" />,
                  title: stringGetter({ key: notification.title }),
                  body: notification.text ? stringGetter({ key: notification.text, params }) : '',
                  toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
                  toastSensitivity: 'foreground',
                  renderCustomBody: ({ isToast, notification }) => (
                    <TradeNotification
                      isToast={isToast}
                      data={parsedData}
                      notification={notification}
                    />
                  ),
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
                  icon: notification.image && <$Icon src={notification.image} alt="" />,
                  title: stringGetter({ key: notification.title }),
                  body: notification.text ? stringGetter({ key: notification.text, params }) : '',
                  toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
                  toastSensitivity: 'foreground',
                },
                [notification.updateTimeInMilliseconds, notification.data],
                true
              );
              break;
          }
        }
      }, [abacusNotifications, stringGetter]);
    },
  },
  {
    type: NotificationType.SquidTransfer,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const { transferNotifications } = useLocalNotifications();
      const { selectedNetwork } = useSelectedNetwork();

      useEffect(() => {
        for (const transfer of transferNotifications) {
          const { fromChainId, status, txHash, toAmount } = transfer;
          const isFinished = Boolean(status) && status?.squidTransactionStatus !== 'ongoing';
          const icon = <Icon iconName={isFinished ? IconName.Transfer : IconName.Clock} />;

          const type =
            fromChainId === ENVIRONMENT_CONFIG_MAP[selectedNetwork].dydxChainId
              ? 'withdrawal'
              : 'deposit';

          const title = stringGetter({
            key: {
              deposit: isFinished ? STRING_KEYS.DEPOSIT : STRING_KEYS.DEPOSIT_IN_PROGRESS,
              withdrawal: isFinished ? STRING_KEYS.WITHDRAW : STRING_KEYS.WITHDRAW_IN_PROGRESS,
            }[type],
          });

          const toChainEta = status?.toChain?.chainData?.estimatedRouteDuration || 0;
          const estimatedDuration = formatSeconds(Math.max(toChainEta, 0));
          const body = stringGetter({
            key: STRING_KEYS.DEPOSIT_STATUS,
            params: {
              AMOUNT_USD: `${toAmount} ${DydxChainAsset.USDC.toUpperCase()}`,
              ESTIMATED_DURATION: estimatedDuration,
            },
          });

          trigger(
            txHash,
            {
              icon,
              title,
              body,
              renderCustomBody: ({ isToast, notification }) => (
                <TransferStatusNotification
                  isToast={isToast}
                  slotIcon={icon}
                  slotTitle={title}
                  transfer={transfer}
                  type={type}
                  triggeredAt={transfer.triggeredAt}
                  notification={notification}
                />
              ),
              toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
              toastSensitivity: 'foreground',
            },
            [isFinished]
          );
        }
      }, [transferNotifications, stringGetter]);
    },
  },
];

const $Icon = styled.img`
  height: 1.5rem;
  width: 1.5rem;
`;
