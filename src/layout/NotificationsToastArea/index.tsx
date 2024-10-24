import { useMemo } from 'react';

import { groupBy } from 'lodash';
import styled from 'styled-components';

import {
  MAX_NUM_TOASTS,
  NotificationCategoryPreferenceOrder,
  NotificationStatus,
  NotificationType,
  NotificationTypeCategory,
} from '@/constants/notifications';

import { useNotifications } from '@/hooks/useNotifications';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { NotificationStack } from './NotifcationStack';

type StyleProps = {
  className?: string;
};

export const NotificationsToastArea = ({ className }: StyleProps) => {
  const { notifications, getKey, getDisplayData, isMenuOpen } = useNotifications();

  const notificationMapByType = useMemo(() => {
    const notificationMap = Object.values(notifications)
      // Sort by time of first trigger
      .sort(
        (n1, n2) =>
          n1.timestamps[NotificationStatus.Triggered]! -
          n2.timestamps[NotificationStatus.Triggered]!
      )
      // Sort by priority
      .sort(
        (n1, n2) =>
          NotificationCategoryPreferenceOrder.indexOf(
            NotificationTypeCategory[n1.type as NotificationType]
          ) -
          NotificationCategoryPreferenceOrder.indexOf(
            NotificationTypeCategory[n2.type as NotificationType]
          )
      )
      .map((notification) => ({
        notification,
        key: getKey(notification),
        displayData: getDisplayData(notification)!, // verified below
      }))
      .filter(
        ({ displayData, notification }) =>
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          displayData && notification.status < NotificationStatus.Unseen
      )
      .slice(-MAX_NUM_TOASTS);
    return groupBy(notificationMap, (notification) => notification.displayData.groupKey);
  }, [notifications, getKey, getDisplayData]);

  if (isMenuOpen) return null;

  return (
    <StyledToastArea className={className}>
      {Object.keys(notificationMapByType).map((groupKey) => (
        <NotificationStack notifications={notificationMapByType[groupKey]!} key={groupKey} />
      ))}
    </StyledToastArea>
  );
};

const StyledToastArea = styled.div`
  ${layoutMixins.scrollArea}

  position: absolute;
  width: min(17.5rem, 100%);
  inset: 0 0 0 auto;

  padding: 0.75rem 0.75rem 0.75rem 0;

  mask-image: linear-gradient(to left, transparent, white 0.5rem);

  pointer-events: none;

  @media ${breakpoints.mobile} {
    display: none; // hide notifications on mobile web view
  }
`;
