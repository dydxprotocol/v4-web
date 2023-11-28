import { type ReactNode, useEffect } from 'react';
import styled from 'styled-components';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { isEqual, groupBy } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { DialogTypes } from '@/constants/dialogs';
import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { AppRoute } from '@/constants/routes';
import { DydxChainAsset } from '@/constants/wallets';

import {
  STRING_KEYS,
  STRING_KEY_VALUES,
  type StringGetterFunction,
  type StringKey,
} from '@/constants/localization';

import {
  type NotificationTypeConfig,
  NotificationType,
  DEFAULT_TOAST_AUTO_CLOSE_MS,
} from '@/constants/notifications';

import { useSelectedNetwork, useStringGetter } from '@/hooks';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';

import { Icon, IconName } from '@/components/Icon';
import { TradeNotification } from '@/views/notifications/TradeNotification';
import { TransferStatusNotification } from '@/views/notifications/TransferStatusNotification';
import { ReleaseUpdatesNotification } from '@/views/notifications/ReleaseUpdatesNotification';

import { getSubaccountFills, getSubaccountOrders } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';
import { getAbacusNotifications } from '@/state/notificationsSelectors';
import { getMarketIds } from '@/state/perpetualsSelectors';

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
        for (const abacusNotif of abacusNotifications) {
          const [abacusNotificationType = '', id = ''] = abacusNotif.id.split(':');
          const parsedData = abacusNotif.data ? JSON.parse(abacusNotif.data) : {};

          const params = Object.fromEntries(
            Object.entries(parsedData).map(([key, value]) => {
              return [key, parseStringParamsForNotification({ stringGetter, value })];
            })
          );

          switch (abacusNotificationType) {
            case 'order': {
              trigger(
                abacusNotif.id,
                {
                  icon: abacusNotif.image && <$Icon src={abacusNotif.image} alt="" />,
                  title: stringGetter({ key: abacusNotif.title }),
                  body: abacusNotif.text ? stringGetter({ key: abacusNotif.text, params }) : '',
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
                [abacusNotif.updateTimeInMilliseconds, abacusNotif.data],
                true
              );
              break;
            }
            default:
              trigger(
                abacusNotif.id,
                {
                  icon: abacusNotif.image && <$Icon src={abacusNotif.image} alt="" />,
                  title: stringGetter({ key: abacusNotif.title }),
                  body: abacusNotif.text ? stringGetter({ key: abacusNotif.text, params }) : '',
                  toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
                  toastSensitivity: 'foreground',
                },
                [abacusNotif.updateTimeInMilliseconds, abacusNotif.data]
              );
              break;
          }
        }
      }, [abacusNotifications, stringGetter]);
    },
    useNotificationAction: () => {
      const dispatch = useDispatch();
      const orders = useSelector(getSubaccountOrders, shallowEqual) || [];
      const ordersById = groupBy(orders, 'id');
      const fills = useSelector(getSubaccountFills, shallowEqual) || [];
      const fillsById = groupBy(fills, 'id');
      const marketIds = useSelector(getMarketIds, shallowEqual);
      const navigate = useNavigate();

      return (notificationId: string) => {
        const [abacusNotificationType = '', id = ''] = notificationId.split(':');

        if (ordersById[id]) {
          dispatch(
            openDialog({
              type: DialogTypes.OrderDetails,
              dialogProps: { orderId: id },
            })
          );
        } else if (fillsById[id]) {
          dispatch(
            openDialog({
              type: DialogTypes.FillDetails,
              dialogProps: { fillId: id },
            })
          );
        } else if (marketIds.includes(id)) {
          navigate(`${AppRoute.Trade}/${id}`, {
            replace: true,
          });
        }
      };
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
              toastSensitivity: 'foreground',
            },
            [isFinished]
          );
        }
      }, [transferNotifications, stringGetter]);
    },
    useNotificationAction: () => {
      return () => {};
    },
  },
  {
    type: NotificationType.ReleaseUpdates,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const body = (
        <div>
          {stringGetter({
            key: 'NOTIFICATIONS.RELEASE_REWARDS_AND_FULL_TRADING.BODY',
            params: {
              BLOGPOST: (
                <$Link
                  href="https://www.dydxopsdao.com/blog/deep-dive-full-trading"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {stringGetter({ key: STRING_KEYS.HERE })}
                </$Link>
              ),
              // todo: update localization to flip the two
              DOS_BLOGPOST: (
                <$Link
                  href="https://dydx.exchange/blog/v4-full-trading"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {stringGetter({ key: STRING_KEYS.HERE })}
                </$Link>
              ),
            },
          })}
        </div>
      );

      useEffect(() => {
        trigger(
          'rewards-and-full-trading-live',
          {
            icon: <Icon iconName={IconName.LogoShort} />,
            title: stringGetter({ key: 'NOTIFICATIONS.RELEASE_REWARDS_AND_FULL_TRADING.TITLE' }),
            renderCustomBody: ({ isToast, notification }) => (
              <ReleaseUpdatesNotification
                isToast={isToast}
                slotTitle={stringGetter({
                  key: 'NOTIFICATIONS.RELEASE_REWARDS_AND_FULL_TRADING.TITLE',
                })}
                slotDescription={body}
                notification={notification}
              />
            ),
            toastSensitivity: 'foreground',
          },
          []
        );
      }, [stringGetter]);
    },
    useNotificationAction: () => {
      return () => {};
    },
  },
];

const $Icon = styled.img`
  height: 1.5rem;
  width: 1.5rem;
`;

const $Link = styled.a`
  --link-color: var(--color-text-2);
`;
