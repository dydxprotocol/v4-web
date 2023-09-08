import { useCallback, useEffect, useMemo } from 'react';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import { groupBy } from 'lodash';

import { AbacusOrderStatus, ORDER_SIDES, ORDER_STATUS_STRINGS } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { type NotificationTypeConfig, NotificationType } from '@/constants/notifications';
import { ORDER_SIDE_STRINGS, TRADE_TYPE_STRINGS, TradeTypes } from '@/constants/trade';

import { useLocalNotifications } from '@/hooks/useLocalNotifications';

import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { TransferStatusToast } from '@/views/TransferStatus';

import { getSubaccountFills, getSubaccountOrders } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';

import { OrderStatusIcon } from '@/views/OrderStatusIcon';

import { useStringGetter } from './useStringGetter';
import { TransferStatusSteps } from '@/views/TransferStatusSteps';
import { TESTNET_CHAIN_ID } from '@dydxprotocol/v4-client-js';

export const notificationTypes = [
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
                  order.status === AbacusOrderStatus.open && (order?.totalFilled ?? 0) > 0
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
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const { transferNotifications } = useLocalNotifications();

      const getTitleStringKey = useCallback((type: 'deposit' | 'withdraw', finished: boolean) => {
        if (type === 'deposit' && !finished) return STRING_KEYS.DEPOSIT_IN_PROGRESS;
        if (type === 'deposit' && finished) return STRING_KEYS.DEPOSIT;
        if (type === 'withdraw' && !finished) return STRING_KEYS.WITHDRAW_IN_PROGRESS;
        return STRING_KEYS.WITHDRAW;
      }, []);

      useEffect(() => {
        for (const transfer of transferNotifications) {
          const { toChainId, status, txHash, toAmount } = transfer;
          const finished = Boolean(status) && status?.squidTransactionStatus !== 'ongoing';
          const type = toChainId === TESTNET_CHAIN_ID ? 'deposit' : 'withdraw';

          trigger(
            txHash,
            {
              icon: <Icon iconName={finished ? IconName.Transfer : IconName.Clock} />,
              title: stringGetter({ key: getTitleStringKey(type, finished) }),
              // TODO: confirm with design what the description should be
              description: (
                <>
                  <span>{type === 'deposit' ? 'Deposit of ' : 'Withdraw of'}</span>
                  <Output type={OutputType.Fiat} value={toAmount} />
                </>
              ),
              customContent: (
                <TransferStatusToast
                  toAmount={transfer.toAmount}
                  triggeredAt={transfer.triggeredAt}
                  status={transfer.status}
                />
              ),
              customMenuContent: !finished && <TransferStatusSteps status={transfer.status} />,
              toastSensitivity: 'foreground',
            },
            []
          );
        }
      }, [transferNotifications]);
    },
  },
] satisfies NotificationTypeConfig[];
