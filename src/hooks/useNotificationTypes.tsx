import { type ReactNode, useEffect } from 'react';
import styled from 'styled-components';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { isEqual, groupBy } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { DialogTypes } from '@/constants/dialogs';
import { AppRoute, TokenRoute } from '@/constants/routes';
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
  TransferNotificationTypes,
  ReleaseUpdateNotificationIds,
} from '@/constants/notifications';

import { useStringGetter, useTokenConfigs } from '@/hooks';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { BlockRewardNotification } from '@/views/notifications/BlockRewardNotification';
import { TradeNotification } from '@/views/notifications/TradeNotification';
import { TransferStatusNotification } from '@/views/notifications/TransferStatusNotification';

import { getSubaccountFills, getSubaccountOrders } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';
import { getAbacusNotifications } from '@/state/notificationsSelectors';
import { getMarketIds } from '@/state/perpetualsSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';

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
                  groupKey: abacusNotificationType,
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
            case 'blockReward': {
              trigger(
                abacusNotif.id,
                {
                  icon: abacusNotif.image && <$Icon src={abacusNotif.image} alt="" />,
                  title: stringGetter({ key: abacusNotif.title }),
                  body: abacusNotif.text ? stringGetter({ key: abacusNotif.text, params }) : '',
                  toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
                  toastSensitivity: 'foreground',
                  groupKey: abacusNotificationType,
                  renderCustomBody: ({ isToast, notification }) => (
                    <BlockRewardNotification
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
                  groupKey: abacusNotificationType,
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
      const selectedDydxChainId = useSelector(getSelectedDydxChainId);

      useEffect(() => {
        for (const transfer of transferNotifications) {
          const { fromChainId, status, txHash, toAmount, type, isExchange } = transfer;
          const isFinished =
            (Boolean(status) && status?.squidTransactionStatus !== 'ongoing') || isExchange;
          const icon = <Icon iconName={isFinished ? IconName.Transfer : IconName.Clock} />;

          const transferType =
            type ?? fromChainId === selectedDydxChainId
              ? TransferNotificationTypes.Withdrawal
              : TransferNotificationTypes.Deposit;

          const title = stringGetter({
            key: {
              deposit: isFinished ? STRING_KEYS.DEPOSIT : STRING_KEYS.DEPOSIT_IN_PROGRESS,
              withdrawal: isFinished ? STRING_KEYS.WITHDRAW : STRING_KEYS.WITHDRAW_IN_PROGRESS,
            }[transferType],
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
                  type={transferType}
                  triggeredAt={transfer.triggeredAt}
                  notification={notification}
                />
              ),
              toastSensitivity: 'foreground',
              groupKey: NotificationType.SquidTransfer,
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
      const { chainTokenLabel } = useTokenConfigs();
      const stringGetter = useStringGetter();
      const expirationDate = new Date('2024-03-08T23:59:59');
      const currentDate = new Date();

      useEffect(() => {
        trigger(
          ReleaseUpdateNotificationIds.RewardsAndFullTradingLive,
          {
            icon: <AssetIcon symbol={chainTokenLabel} />,
            title: stringGetter({ key: 'NOTIFICATIONS.RELEASE_REWARDS_AND_FULL_TRADING.TITLE' }),
            body: stringGetter({
              key: 'NOTIFICATIONS.RELEASE_REWARDS_AND_FULL_TRADING.BODY',
              params: {
                DOS_BLOGPOST: (
                  <$Link
                    href="https://www.dydxopsdao.com/blog/deep-dive-full-trading"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {stringGetter({ key: STRING_KEYS.HERE })}
                  </$Link>
                ),
                TRADING_BLOGPOST: (
                  <$Link
                    href="https://dydx.exchange/blog/v4-full-trading"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {stringGetter({ key: STRING_KEYS.HERE })}
                  </$Link>
                ),
              },
            }),
            toastSensitivity: 'foreground',
            groupKey: ReleaseUpdateNotificationIds.RewardsAndFullTradingLive,
          },
          []
        );
        if (currentDate <= expirationDate) {
          trigger(
            ReleaseUpdateNotificationIds.IncentivesS3,
            {
              icon: <AssetIcon symbol={chainTokenLabel} />,
              title: stringGetter({ key: 'NOTIFICATIONS.INCENTIVES_SEASON_BEGUN.TITLE' }),
              body: stringGetter({
                key: 'NOTIFICATIONS.INCENTIVES_SEASON_BEGUN.BODY',
                params: {
                  SEASON_NUMBER: '3',
                  PREV_SEASON_NUMBER: '1',
                  DYDX_AMOUNT: '34',
                  USDC_AMOUNT: '100',
                },
              }),
              toastSensitivity: 'foreground',
              groupKey: ReleaseUpdateNotificationIds.IncentivesS3,
            },
            []
          );
        }
      }, [stringGetter]);
    },
    useNotificationAction: () => {
      const { chainTokenLabel } = useTokenConfigs();
      const navigate = useNavigate();
      return (notificationId: string) => {
        if (notificationId === ReleaseUpdateNotificationIds.IncentivesS3) {
          navigate(`${chainTokenLabel}/${TokenRoute.TradingRewards}`);
        }
      };
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
