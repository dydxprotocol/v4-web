import { useMemo, useRef } from 'react';

import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { orderBy } from 'lodash';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import {
  Notification,
  NotificationDisplayData,
  NotificationStatus,
  NotificationType,
} from '@/constants/notifications';

import { useNotifications } from '@/hooks/useNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';

import { BlockRewardNotificationRow } from './BlockRewardNotificationRow';
import { FillWithNoOrderNotificationRow } from './FillWithNoOrderNotificationRow';
import { OrderCancelNotificationRow } from './OrderCancelNotificationRow';
import { OrderNotificationRow } from './OrderNotificationRow';
import { OrderStatusNotificationRow } from './OrderStatusNotificationRow';
import { SkipTransferNotificationRow } from './SkipTransferNotificationRow';
import { UnseenIndicator } from './UnseenIndicator';

const DEFAULT_NOTIFICATION_HEIGHT = 128;
const NOTIFICATION_HEIGHT = 64;

const filterMetadata = (notification: Notification) => {
  const metadata = notification.metadata;

  switch (notification.type) {
    case NotificationType.Order:
    case NotificationType.BlockTradingReward:
    case NotificationType.OrderStatus:
    case NotificationType.SkipTransfer2:
    case NotificationType.FillWithNoOrder: {
      return metadata != null;
    }

    default: {
      return true;
    }
  }
};

const getHeightForNotificationRow = (notification?: Notification) => {
  if (!notification) {
    return DEFAULT_NOTIFICATION_HEIGHT;
  }

  switch (notification.type) {
    case NotificationType.Order:
    case NotificationType.BlockTradingReward:
    case NotificationType.OrderStatus:
    case NotificationType.SkipTransfer2:
    case NotificationType.FillWithNoOrder:
      return NOTIFICATION_HEIGHT;
    default:
      return DEFAULT_NOTIFICATION_HEIGHT;
  }
};

export const AlertsList = () => {
  const { notifications, getDisplayData, getKey } = useNotifications();
  const stringGetter = useStringGetter();

  const items = useMemo(() => {
    // Filter cleared notifications
    const flatNotifications = Object.values(notifications).filter(
      (notif) => notif.status < NotificationStatus.Cleared
    );

    // Sort by triggered timestamp
    const sortedNotifications = orderBy(
      flatNotifications,
      (notif) => notif.timestamps[NotificationStatus.Triggered],
      'desc'
    );

    return sortedNotifications
      .map((notif) => ({
        notification: notif,
        key: getKey(notif),
        displayData: getDisplayData(notif)!,
      }))
      .filter(
        ({ notification, displayData }) => filterMetadata(notification) && displayData != null
      );
  }, [notifications, getDisplayData, getKey]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    estimateSize: (_index: number) => getHeightForNotificationRow(items?.[_index]?.notification),
    getScrollElement: () => parentRef.current,
    rangeExtractor: (range) => {
      return [...new Set([0, ...defaultRangeExtractor(range)])];
    },
  });

  if (items.length === 0) {
    return (
      <div tw="row relative h-full max-h-full w-full max-w-full justify-center">
        {stringGetter({ key: STRING_KEYS.NOTIFICATIONS_EMPTY_STATE })}
      </div>
    );
  }

  return (
    <div ref={parentRef} tw="relative h-full max-h-full w-full max-w-full overflow-auto">
      <div
        tw="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            tw="row left-0 top-0 w-full bg-color-layer-2"
            style={{
              height: `${virtualRow.size}px`,
              position: 'absolute',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ItemRenderer
              css={{
                height: `${virtualRow.size}px`,
              }}
              notification={items[virtualRow.index]!.notification}
              displayData={items[virtualRow.index]!.displayData}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const ItemRenderer = ({
  className,
  notification,
  displayData,
}: {
  className?: string;
  notification: Notification;
  displayData: NotificationDisplayData;
}) => {
  const metadata = notification.metadata;
  const isUnseen = notification.status === NotificationStatus.Unseen;

  const timestamp =
    notification.timestamps[NotificationStatus.Updated] ??
    notification.timestamps[NotificationStatus.Triggered]!;

  if (metadata?.type === NotificationType.Order) {
    return (
      <OrderNotificationRow
        className={className}
        timestamp={timestamp}
        subaccountOrder={metadata.order}
        relevantFills={metadata.relevantFills}
        isUnseen={isUnseen}
      />
    );
  }

  if (metadata?.type === 'OrderStatusLocalPlaceOrder') {
    return (
      <OrderStatusNotificationRow
        className={className}
        timestamp={timestamp}
        localPlaceOrder={metadata.localPlaceOrder}
        isUnseen={isUnseen}
      />
    );
  }

  if (metadata?.type === 'OrderStatusLocalCancelOrder') {
    return (
      <OrderCancelNotificationRow
        className={className}
        timestamp={timestamp}
        localCancel={metadata.localCancelOrder}
        isUnseen={isUnseen}
      />
    );
  }

  if (metadata?.type === NotificationType.BlockTradingReward) {
    return (
      <BlockRewardNotificationRow
        className={className}
        blockReward={metadata.blockReward}
        isUnseen={isUnseen}
      />
    );
  }

  if (metadata?.type === NotificationType.SkipTransfer2) {
    return (
      <SkipTransferNotificationRow
        className={className}
        transferId={metadata.transferId}
        isUnseen={isUnseen}
      />
    );
  }

  if (metadata?.type === NotificationType.FillWithNoOrder) {
    return (
      <FillWithNoOrderNotificationRow
        className={className}
        fill={metadata.fill}
        timestamp={timestamp}
        isUnseen={isUnseen}
      />
    );
  }

  return (
    <$DefaultNotificationRow className={className}>
      <div tw="flexColumn min-w-0 flex-grow-0 gap-0.5">
        <div tw="row w-full justify-between">
          <div tw="row gap-0.25">
            {displayData.icon && <div tw="relative flex">{displayData.icon}</div>}
            <div tw="flex-1 text-color-text-2 font-mini-book">{displayData.title}</div>
          </div>
          {isUnseen && <UnseenIndicator />}
        </div>

        <div tw="flexColumn">
          <div tw="text-color-text-1 font-mini-book">{displayData.body}</div>
        </div>
      </div>
    </$DefaultNotificationRow>
  );
};

const $DefaultNotificationRow = styled.div`
  ${tw`row w-full justify-between gap-0.5 px-1.25`}
  border-bottom: var(--default-border-width) solid var(--color-layer-3);
`;
