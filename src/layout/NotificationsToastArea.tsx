import { NotificationStatus } from '@/constants/notifications';
import { ButtonSize } from '@/constants/buttons';

import { useNotifications } from '@/hooks/useNotifications';
import { useBreakpoints } from '@/hooks/useBreakpoints';

import { ToastArea } from '@/components/ToastArea';
import { Toast } from '@/components/Toast';
import { Button } from '@/components/Button';

import styled from 'styled-components';

type StyleProps = {
  className?: string;
};

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

  return (
    <StyledToastArea swipeDirection={isMobile ? 'up' : 'right'} className={className}>
      {Object.values(notifications)
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
        .filter(({ displayData }) => displayData)
        .map(({ notification, key, displayData }) => (
          <Toast
            key={key}
            isOpen={notification.status < NotificationStatus.Unseen}
            slotIcon={displayData.icon}
            slotTitle={displayData.title}
            slotDescription={displayData.description}
            slotCustomContent={displayData.customContent}
            slotAction={
              <Button size={ButtonSize.Small} onClick={() => onNotificationAction(notification)}>
                {displayData.actionDescription}
              </Button>
            }
            actionDescription={displayData.actionDescription}
            actionAltText={displayData.actionAltText}
            duration={isMenuOpen ? Infinity : displayData.toastDuration}
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
