import { useMemo } from 'react';
import { groupBy } from 'lodash';
import styled from 'styled-components';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { NotificationStatus } from '@/constants/notifications';
import { useNotifications } from '@/hooks/useNotifications';

import { NotificationStack } from './NotifcationStack';

type StyleProps = {
  className?: string;
};

const MAX_TOASTS = 10;

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
      .map((notification) => ({
        notification,
        key: getKey(notification),
        displayData: getDisplayData(notification),
      }))
      .filter(
        ({ displayData, notification }) =>
          displayData && notification.status < NotificationStatus.Unseen
      )
      .slice(-MAX_TOASTS);
    return groupBy(notificationMap, (notification) => notification.displayData?.groupKey);
  }, [notifications, getKey, getDisplayData]);

  if (isMenuOpen) return null;

  return (
    <StyledToastArea className={className}>
      {Object.keys(notificationMapByType).map((groupKey) => (
        <NotificationStack notifications={notificationMapByType[groupKey]} key={groupKey} />
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
    width: 100%;
    position: fixed;
  }
`;
