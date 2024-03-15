import { useState } from 'react';

import styled, { css } from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import {
  type Notification,
  type NotificationDisplayData,
  NotificationStatus,
} from '@/constants/notifications';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useNotifications } from '@/hooks/useNotifications';

import { ChevronLeftIcon } from '@/icons';
import { breakpoints } from '@/styles';

import { Button } from '@/components/Button';
import { Toast } from '@/components/Toast';
import { ToastArea } from '@/components/ToastArea';
import { ToggleButton } from '@/components/ToggleButton';

type ElementProps = {
  notifications: {
    notification: Notification<any, any>;
    key: string;
    displayData: NotificationDisplayData;
  }[];
};

type StyleProps = {
  className?: string;
};

export const NotificationStack = ({ notifications, className }: ElementProps & StyleProps) => {
  const [shouldStackNotifications, setshouldStackNotifications] = useState(true);

  const { markUnseen, markSeen, onNotificationAction } = useNotifications();
  const { isMobile } = useBreakpoints();
  const hasMultipleToasts = notifications.length > 1;

  return (
    <StyledToastArea
      swipeDirection={isMobile ? 'up' : 'right'}
      className={className}
      size={notifications.length}
    >
      {hasMultipleToasts && (
        <StyledToggleButton
          shape={ButtonShape.Pill}
          size={ButtonSize.XSmall}
          isPressed={shouldStackNotifications}
          onPressedChange={() => setshouldStackNotifications(!shouldStackNotifications)}
        >
          <ChevronLeftIcon />
        </StyledToggleButton>
      )}

      {notifications.map(({ notification, key, displayData }, idx) => (
        <StyledToast
          key={key}
          isStacked={idx > 0 && shouldStackNotifications}
          isOpen={notification.status < NotificationStatus.Unseen}
          layer={idx}
          notification={notification}
          slotIcon={displayData.icon}
          slotTitle={displayData.title}
          slotTitleLeft={displayData.slotTitleLeft}
          slotTitleRight={displayData.slotTitleRight}
          slotDescription={displayData.body}
          slotCustomContent={displayData.renderCustomBody?.({ isToast: true, notification })}
          onClick={() => onNotificationAction(notification)}
          slotAction={
            displayData.renderActionSlot ? (
              displayData.renderActionSlot({ isToast: true, notification })
            ) : displayData.actionDescription ? (
              <Button size={ButtonSize.Small} onClick={() => onNotificationAction(notification)}>
                {displayData.actionDescription}
              </Button>
            ) : undefined
          }
          actionDescription={displayData.actionDescription}
          actionAltText={displayData.actionAltText}
          duration={displayData.toastDuration ?? Infinity}
          sensitivity={displayData.toastSensitivity}
          setIsOpen={(isOpen: boolean, isClosedFromTimeout?: boolean) => {
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

const StyledToastArea = styled(ToastArea)<{ size: number }>`
  position: relative;
  ${({ size }) =>
    size &&
    css`
      padding-bottom: calc(${size - 1} * 2px);
    `}
`;

const StyledToast = styled(Toast)<{ isStacked?: boolean; layer: number }>`
  // Stacked toast
  ${({ isStacked, layer }) =>
    isStacked
      ? css`
          position: absolute;
          left: 0;
          top: calc(${layer} * 2px);
          right: 0;
        `
      : css`
          margin-bottom: 0.75rem;
        `}
`;

const StyledToggleButton = styled(ToggleButton)<{ isPressed: boolean }>`
  z-index: 2;
  pointer-events: auto;
  display: none;
  position: absolute;
  top: -0.5rem;
  left: calc(50% - 0.75rem);
  --button-width: 2rem;
  --button-height: 1rem;

  ${StyledToastArea}:hover & {
    display: flex;
  }

  > svg {
    width: 4px;
    margin-top: 1px;
    transform: rotate(-90deg);

    ${({ isPressed }) =>
      !isPressed &&
      css`
        transform: rotate(90deg);
      `}
  }

  @media ${breakpoints.mobile} {
    display: flex;
    left: calc(50% - 2rem);
    --button-width: 4rem;
    --button-height: 2rem;
  }
`;
