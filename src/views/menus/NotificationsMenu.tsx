import React, { useMemo } from 'react';

import { groupBy } from 'lodash';

import { type Notification, NotificationStatus } from '@/constants/notifications';

import { useNotifications } from '@/hooks/useNotifications';

import { Button } from '@/components/Button';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { DialogPlacement } from '@/components/Dialog';
import { Output, OutputType } from '@/components/Output';
import { IconButton } from '@/components/IconButton';
import { Toolbar } from '@/components/Toolbar';
import { CloseIcon } from '@/icons';

import styled from 'styled-components';
import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  slotTrigger?: React.ReactNode;
  placement?: DialogPlacement;
};

export const NotificationsMenu = ({
  slotTrigger,
  placement = DialogPlacement.Sidebar,
}: ElementProps) => {
  const {
    notifications,
    getDisplayData,
    getKey,

    markSeen,
    markCleared,
    markAllCleared,

    onNotificationAction,

    hasEnabledPush,
    isEnablingPush,
    enablePush,
    disablePush,

    isMenuOpen,
    setIsMenuOpen,
  } = useNotifications();

  const notificationsByStatus: Partial<Record<NotificationStatus, Notification[]>> = useMemo(
    () =>
      groupBy(Object.values(notifications).filter(getDisplayData), (notification) =>
        notification.status < NotificationStatus.Seen
          ? NotificationStatus.Triggered
          : notification.status
      ),
    [notifications, getDisplayData]
  );

  const hasUnreadNotifications = useMemo(
    () => notificationsByStatus[NotificationStatus.Triggered]?.length! > 0,
    [notificationsByStatus]
  );

  const items: Parameters<typeof ComboboxDialogMenu>[0]['items'] = useMemo(
    () =>
      (Object.entries(notificationsByStatus) as unknown as [NotificationStatus, Notification[]][])
        // .filter(([status]) => status !== NotificationStatus.Cleared)
        .map(([status, notifications]) => ({
          group: status,
          groupLabel: {
            [NotificationStatus.Triggered]: 'New',
            // [NotificationStatus.Updated]: 'Updates',
            [NotificationStatus.Seen]: 'Seen',
            [NotificationStatus.Cleared]: 'Archived',
          }[status as number],

          items: notifications
            .sort(
              (n1, n2) =>
                n2.timestamps[NotificationStatus.Triggered]! -
                n1.timestamps[NotificationStatus.Triggered]!
            )
            .map((notification) => ({
              notification,
              key: getKey(notification),
              displayData: getDisplayData(notification),
            }))
            .map(({ notification, key, displayData }) => ({
              value: key,
              label: displayData.title ?? '',
              description: displayData.customMenuContent || displayData.description,
              slotBefore: !displayData.customMenuContent && displayData.icon,
              slotAfter: !displayData.customMenuContent && (
                <>
                  <$Output
                    type={OutputType.RelativeTime}
                    value={
                      notification.timestamps[NotificationStatus.Updated] ||
                      notification.timestamps[NotificationStatus.Triggered]
                    }
                  />

                  {notification.status < NotificationStatus.Seen ? <$UnreadIndicator /> : null}

                  {notification.status < NotificationStatus.Cleared ? (
                    <$IconButton
                      iconComponent={CloseIcon}
                      onClick={(e) => {
                        e.stopPropagation();

                        /*if (notification.status < NotificationStatus.Seen) {
                          markSeen(notification);
                        } else*/ if (notification.status < NotificationStatus.Cleared) {
                          markCleared(notification);
                        }
                      }}
                    />
                  ) : null}
                </>
              ),
              disabled: notification.status === NotificationStatus.Cleared,
              onSelect: () => {
                onNotificationAction(notification);
                markSeen(notification);
              },
            })),
        }))
        .filter(({ items }) => items.length),
    [notificationsByStatus, getDisplayData, onNotificationAction, markSeen]
  );

  return (
    <ComboboxDialogMenu
      isOpen={isMenuOpen || placement === DialogPlacement.Inline}
      setIsOpen={setIsMenuOpen}
      items={items}
      title="Notifications"
      slotTrigger={
        <$TriggerContainer>
          {slotTrigger}
          {hasUnreadNotifications && <$TriggerUnreadIndicator />}
        </$TriggerContainer>
      }
      slotFooter={
        <$FooterToolbar>
          {!hasEnabledPush ? (
            <Button
              size={ButtonSize.Small}
              state={{ isLoading: isEnablingPush }}
              onClick={enablePush}
            >
              Enable Push Notifications
            </Button>
          ) : (
            <Button size={ButtonSize.Small} action={ButtonAction.Secondary} onClick={disablePush}>
              Disable Push Notifications
            </Button>
          )}

          <Button
            size={ButtonSize.Small}
            action={ButtonAction.Reset}
            onClick={markAllCleared}
            state={{
              isDisabled: Object.values(notifications).every(
                (notification) => notification.status === NotificationStatus.Cleared
              ),
            }}
          >
            Clear All
          </Button>
        </$FooterToolbar>
      }
      placement={placement}
    />
  );
};

const $UnreadIndicator = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--color-accent);
  border: 1px solid var(--color-layer-2);
`;

const $TriggerContainer = styled.div`
  ${layoutMixins.stack}
`;

const $TriggerUnreadIndicator = styled($UnreadIndicator)`
  place-self: center;

  position: relative;
  right: -0.2rem;
  top: -0.325rem;
`;

const $Output = styled(Output)`
  color: var(--color-text-0);
`;

const $IconButton = styled(IconButton)`
  --button-border: none;
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);
`;

const $FooterToolbar = styled(Toolbar)`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0;

  > * {
    flex: 1 auto;
  }
`;
