import { useEffect, useMemo, useRef } from 'react';

import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { orderBy } from 'lodash';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import {
  Notification,
  NotificationDisplayData,
  NotificationStatus,
} from '@/constants/notifications';

import { useNotifications } from '@/hooks/useNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';

import { isTruthy } from '@/lib/isTruthy';

import { UnseenIndicator } from './UnseenIndicator';

const STANDARD_NOTIFICATION_HEIGHT = 128;
const CUSTOM_ALERT_ROW_HEIGHT = 64;

export const AlertsList = () => {
  const { notifications, getDisplayData, getKey, markSeen } = useNotifications();
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
      .map((notif) => {
        const displayData = getDisplayData(notif);

        if (displayData == null) {
          markSeen(notif);
          return undefined;
        }

        return {
          notification: notif,
          key: getKey(notif),
          displayData,
        };
      })
      .filter(isTruthy);
  }, [notifications, getDisplayData, getKey, markSeen]);

  // Mark all notifications as seen when the user leaves the Alerts Page
  useEffect(() => {
    return () => {
      items.forEach(({ notification }) => {
        if (notification.status <= NotificationStatus.Unseen) {
          markSeen(notification);
        }
      });
    };
  }, [items, markSeen]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    estimateSize: (_index: number) =>
      items[_index]?.displayData.renderSimpleAlert
        ? CUSTOM_ALERT_ROW_HEIGHT
        : STANDARD_NOTIFICATION_HEIGHT,
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
  if (displayData.renderSimpleAlert) {
    return displayData.renderSimpleAlert({ className, notification });
  }

  const isUnseen = notification.status <= NotificationStatus.Unseen;

  return (
    <$DefaultNotificationRow className={className}>
      <div tw="flexColumn w-full min-w-0 flex-grow-0 gap-0.125">
        <div tw="row w-full justify-between">
          <div tw="row gap-0.25">
            {displayData.icon && <div tw="relative flex">{displayData.icon}</div>}
            <div tw="flex-1 text-color-text-2 font-base-book">{displayData.title}</div>
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
