import styled, { css } from 'styled-components';

import { NotificationStatus } from '@/constants/notifications';
import { ButtonSize } from '@/constants/buttons';

import { useNotifications } from '@/hooks/useNotifications';
import { useBreakpoints } from '@/hooks/useBreakpoints';

import { Button } from '@/components/Button';
import { Toast } from '@/components/Toast';
import { ToastArea } from '@/components/ToastArea';

type StyleProps = {
  className?: string;
};

const MAX_TOASTS = 10;

export const NotificationsToastArea = ({ className }: StyleProps) => {
  const {
    notifications,
    getKey,
    getDisplayData,
    markUnseen,
    markSeen,
    isMenuOpen,
    onNotificationAction,
  } = useNotifications();

  const { isMobile } = useBreakpoints();

  const notificationMap = !isMenuOpen
    ? Object.values(notifications)
        // Sort by time of first trigger
        .sort(
          (n1, n2) =>
            n1.timestamps[NotificationStatus.Triggered]! -
            n2.timestamps[NotificationStatus.Triggered]!
        )
        .slice(0, MAX_TOASTS)
        .map((notification) => ({
          notification,
          key: getKey(notification),
          displayData: getDisplayData(notification),
        }))
        .filter(({ displayData }) => displayData)
    : [];

  return (
    <StyledToastArea swipeDirection={isMobile ? 'up' : 'right'} className={className}>
      {notificationMap.map(({ notification, key, displayData }, idx) => (
        <StyledToast
          key={key}
          layer={notificationMap.length - 1 - idx}
          isOpen={notification.status < NotificationStatus.Unseen}
          slotIcon={displayData.icon}
          slotTitle={displayData.title}
          slotDescription={displayData.body}
          slotCustomContent={displayData.customBody}
          slotAction={
            <Button size={ButtonSize.Small} onClick={() => onNotificationAction(notification)}>
              {displayData.actionDescription}
            </Button>
          }
          actionDescription={displayData.actionDescription}
          actionAltText={displayData.actionAltText}
          duration={displayData.toastDuration ?? Infinity}
          sensitivity={displayData.toastSensitivity}
          setIsOpen={(isOpen, isClosedFromTimeout) => {
            if (!isOpen)
              if (isClosedFromTimeout)
                // Toast timer expired without user interaction
                markUnseen(notification);
              // Toast interacted with or dismissed
              else markSeen(notification);
          }}
          lastUpdated={notification.timestamps[notification.status]}
        />
      ))}
    </StyledToastArea>
  );
};

const StyledToastArea = styled(ToastArea)`
  position: absolute;
  width: min(16rem, 100%);
  inset: 0 0 0 auto;

  padding: 0.75rem 0.75rem 0.75rem 0;

  mask-image: linear-gradient(to left, transparent, white 0.5rem);
`;

const StyledToast = styled(Toast)<{ layer: number }>`
  // Stacked toast
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  ${({ layer }) => css`
    right: calc(${layer} * -2px);
    top: calc(${layer} * 2px);
  `}
`;
