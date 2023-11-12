import { useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import { NotificationStatus } from '@/constants/notifications';
import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { useNotifications } from '@/hooks/useNotifications';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { ChevronLeftIcon } from '@/icons';
import { breakpoints } from '@/styles';

import { Button } from '@/components/Button';
import { Toast } from '@/components/Toast';
import { ToastArea } from '@/components/ToastArea';

type StyleProps = {
  className?: string;
};

const MAX_TOASTS = 10;

export const NotificationsToastArea = ({ className }: StyleProps) => {
  const [shouldStackNotifications, setshouldStackNotifications] = useState(true);

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
  const notificationMap = useMemo(() => {
    return (
      Object.values(notifications)
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
        .slice(-MAX_TOASTS)
    );
  }, [notifications, getKey, getDisplayData]);

  if (isMenuOpen) return null;

  const hasMultipleToasts =
    notificationMap.filter(({ notification }) => notification.status < NotificationStatus.Unseen)
      .length > 1;

  return (
    <StyledToastArea swipeDirection={isMobile ? 'up' : 'right'} className={className}>
      {hasMultipleToasts && (
        <StyledOptionButton
          shape={ButtonShape.Pill}
          size={ButtonSize.XSmall}
          hasStackedNotifs={shouldStackNotifications}
          action={ButtonAction.Secondary}
          onClick={() => setshouldStackNotifications(!shouldStackNotifications)}
        >
          <ChevronLeftIcon />
        </StyledOptionButton>
      )}

      {notificationMap.map(({ notification, key, displayData }) => (
        <StyledToast
          key={key}
          isStacked={!isMobile && shouldStackNotifications}
          isOpen={notification.status < NotificationStatus.Unseen}
          notification={notification}
          slotIcon={displayData.icon}
          slotTitle={displayData.title}
          slotTitleLeft={displayData.slotTitleLeft}
          slotTitleRight={displayData.slotTitleRight}
          slotDescription={displayData.body}
          slotCustomContent={displayData.renderCustomBody?.({ isToast: true, notification })}
          onClick={() => onNotificationAction(notification)}
          slotAction={
            <Button size={ButtonSize.Small} onClick={() => onNotificationAction(notification)}>
              {displayData.actionDescription}
            </Button>
          }
          actionDescription={displayData.actionDescription}
          actionAltText={displayData.actionAltText}
          duration={displayData.toastDuration ?? Infinity}
          sensitivity={displayData.toastSensitivity}
          setIsOpen={(isOpen: boolean, isClosedFromTimeout: boolean) => {
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
  width: min(17.5rem, 100%);
  inset: 0 0 0 auto;

  padding: 0.75rem 0.75rem 0.75rem 0;

  mask-image: linear-gradient(to left, transparent, white 0.5rem);

  @media ${breakpoints.mobile} {
    width: 100%;
    position: fixed;
  }
`;

const StyledToast = styled(Toast)<{ isStacked?: boolean; layer: number }>`
  // Stacked toast
  ${({ isStacked }) =>
    isStacked
      ? css`
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
        `
      : css`
          margin-bottom: 0.75rem;
        `}
`;

const StyledOptionButton = styled(Button)<{ hasStackedNotifs: boolean }>`
  z-index: 2;
  pointer-events: auto;
  display: none;
  position: absolute;
  top: 4px;
  left: calc(50% - 0.75rem);
  --button-width: 2rem;
  --button-height: 1rem;

  ${StyledToastArea}:hover & {
    display: flex;
    background-color: var(--color-layer-2);
  }

  > svg {
    width: 4px;
    margin-top: 1px;
    transform: rotate(-90deg);

    ${({ hasStackedNotifs }) =>
      !hasStackedNotifs &&
      css`
        transform: rotate(90deg);
      `}
  }

  @media ${breakpoints.mobile} {
    display: none;
  }
`;
