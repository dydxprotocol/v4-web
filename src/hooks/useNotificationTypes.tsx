import { useEffect, useMemo } from 'react';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import { groupBy } from 'lodash';

import { AbacusOrderStatus, ORDER_SIDES, ORDER_STATUS_STRINGS } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { type NotificationTypeConfig, type TransferNotifcation, NotificationType } from '@/constants/notifications';
import { ORDER_SIDE_STRINGS, TRADE_TYPE_STRINGS, TradeTypes } from '@/constants/trade';

import { Icon, IconName } from '@/components/Icon';
import { TransferStatusToast } from '@/components/TransferStatus';

import {
  getSquidTransfers,
  getSubaccountFills,
  getSubaccountOrders,
} from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';

import { OrderStatusIcon } from '@/views/OrderStatusIcon';

import { useStringGetter } from './useStringGetter';

export const notificationTypes = (
  transferNotifications: TransferNotifcation[]
) => [
  {
    type: NotificationType.OrderStatusChanged,

    useTrigger: ({ trigger, lastUpdated }) => {
      const stringGetter = useStringGetter();

      const orders = useSelector(getSubaccountOrders, shallowEqual) || [];
      const ordersByOrderId = Object.fromEntries(orders.map((order) => [order.id, order]));

      const fills = useSelector(getSubaccountFills, shallowEqual) || [];
      const fillsByOrderId = groupBy(fills, (fill) => fill.orderId);

      const orderIds = useMemo(
        () => [...Object.keys(ordersByOrderId), ...Object.keys(fillsByOrderId)],
        [orders, fills]
      );

      useEffect(() => {
        for (const orderId of orderIds) {
          const fills = fillsByOrderId[orderId];

          const order =
            ordersByOrderId[orderId] ??
            (fills?.length
              ? {
                  ...fills[fills.length - 1],
                  id: orderId,
                  createdAtMilliseconds: Math.max(
                    ...fills.map((fill) => fill.createdAtMilliseconds)
                  ),
                  status: AbacusOrderStatus.filled,
                }
              : undefined);

          if (order)
            trigger(
              order.id,
              {
                icon: (
                  <OrderStatusIcon status={order.status} totalFilled={order.totalFilled ?? 0} />
                ),
                title: `${stringGetter({
                  key: TRADE_TYPE_STRINGS[order.type.rawValue as TradeTypes].tradeTypeKey,
                })} ${
                  order.status === AbacusOrderStatus.open && order.totalFilled > 0
                    ? stringGetter({ key: STRING_KEYS.PARTIALLY_FILLED })
                    : stringGetter({ key: ORDER_STATUS_STRINGS[order.status.name] })
                }`,
                description: `${stringGetter({
                  key: ORDER_SIDE_STRINGS[ORDER_SIDES[order.side.name]],
                })} ${order.size} ${order.marketId} @ $${order.price}`,
                actionDescription: 'View Order',
                actionAltText: 'View this order in the Orders tab or the Notifications menu.',
                toastSensitivity:
                  order.status === AbacusOrderStatus.pending ? 'foreground' : 'background',
                toastDuration: 5000,
              },
              [order.status.name, order.size],
              !order.createdAtMilliseconds || order.createdAtMilliseconds > lastUpdated
            );
        }
      }, [orderIds]);
    },

    useNotificationAction: () => {
      const dispatch = useDispatch();

      return (orderId) => {
        dispatch(
          openDialog({
            type: DialogTypes.OrderDetails,
            dialogProps: { orderId },
          })
        );
      };
    },
  } as NotificationTypeConfig<string, [string, number]>,
  {
    type: NotificationType.SquidTransfer,
    useTrigger: ({ trigger, lastUpdated }) => {
      useEffect(() => {
        for (const transfer of transferNotifications) {
          const transferHash = transfer.txHash;
          trigger(
            transferHash,
            {
              icon: <Icon iconName={IconName.Clock} />,
              title: `Deposit in progress...`,
              description: (
                <TransferStatusToast
                  txHash={transferHash}
                  toChainId={transfer.toChainId}
                  fromChainId={transfer.fromChainId}
                  toAmount={transfer.toAmount}
                  triggeredAt={transfer.triggeredAt}
                />
              ),
              toastSensitivity: 'foreground',
            },
            [],
          );
        }
      }, [transferNotifications]);
    },
  },
] satisfies NotificationTypeConfig[];
