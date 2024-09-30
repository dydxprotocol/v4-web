import React, { useMemo } from 'react';

import { groupBy } from 'lodash';
import styled from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NotificationStatus, type Notification } from '@/constants/notifications';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useNotifications } from '@/hooks/useNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { DialogPlacement } from '@/components/Dialog';
import { Notification as NotificationCard } from '@/components/Notification';
import { Toolbar } from '@/components/Toolbar';

type ElementProps = {
  slotTrigger?: React.ReactNode;
  placement?: DialogPlacement;
};

export const NotificationsMenu = ({
  slotTrigger,
  placement = DialogPlacement.Sidebar,
}: ElementProps) => {
  const { isTablet } = useBreakpoints();
  const stringGetter = useStringGetter();

  const {
    notifications,
    getDisplayData,
    getKey,

    markSeen,
    markAllCleared,

    onNotificationAction,

    hasEnabledPush,
    isEnablingPush,
    enablePush,
    disablePush,

    isMenuOpen,
    setIsMenuOpen,

    hasUnreadNotifications,
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

  const items: Parameters<typeof ComboboxDialogMenu>[0]['items'] = useMemo(
    () =>
      (Object.entries(notificationsByStatus) as unknown as [NotificationStatus, Notification[]][])
        .filter(([status]) => status < NotificationStatus.Cleared)
        .map(([status, innerNotifications]) => ({
          group: status,
          groupLabel: {
            [NotificationStatus.Triggered]: stringGetter({ key: STRING_KEYS.NEW }),
            [NotificationStatus.Seen]: 'Seen',
          }[status as number],

          items: innerNotifications
            .sort(
              (n1, n2) =>
                n2.timestamps[NotificationStatus.Triggered]! -
                n1.timestamps[NotificationStatus.Triggered]!
            )
            .map((notification) => ({
              notification,
              key: getKey?.(notification),
              displayData: getDisplayData?.(notification),
            }))
            .map(({ notification, key, displayData }) => ({
              value: key,
              label: displayData.title,
              description: displayData.body,
              slotCustomContent: displayData.renderCustomBody?.({ notification }) ?? (
                <NotificationCard
                  isToast={false}
                  slotIcon={displayData.icon}
                  slotTitle={displayData.title}
                  slotDescription={displayData.body}
                  slotAction={
                    displayData.renderActionSlot ? (
                      displayData.renderActionSlot({ isToast: false, notification })
                    ) : displayData.actionDescription ? (
                      <Button
                        size={ButtonSize.Small}
                        onClick={() => onNotificationAction(notification)}
                      >
                        {displayData.actionDescription}
                      </Button>
                    ) : undefined
                  }
                  notification={notification}
                  withClose={displayData.withClose}
                />
              ),
              disabled: notification.status === NotificationStatus.Cleared,
              onSelect: () => {
                onNotificationAction?.(notification);
                markSeen?.(notification);
              },
            })),
        }))
        .filter(({ items: allItems }) => allItems.length),
    [notificationsByStatus, getDisplayData, onNotificationAction, markSeen, stringGetter]
  );

  return (
    <$ComboboxDialogMenu
      withItemBorders
      isOpen={isMenuOpen || placement === DialogPlacement.Inline}
      setIsOpen={setIsMenuOpen}
      items={items}
      title={stringGetter({ key: STRING_KEYS.NOTIFICATIONS })}
      slotTrigger={
        <div tw="stack">
          {slotTrigger}
          {hasUnreadNotifications && (
            <$UnreadIndicator tw="relative right-[-0.2rem] top-[-0.325rem] place-self-center" />
          )}
        </div>
      }
      slotFooter={
        <$FooterToolbar>
          {!hasEnabledPush ? (
            <Button
              size={ButtonSize.Small}
              state={{ isLoading: isEnablingPush }}
              onClick={enablePush}
            >
              {stringGetter({ key: STRING_KEYS.ENABLE_PUSH_NOTIFICATIONS })}
            </Button>
          ) : (
            <Button size={ButtonSize.Small} action={ButtonAction.Secondary} onClick={disablePush}>
              {stringGetter({ key: STRING_KEYS.DISABLE_PUSH_NOTIFICATIONS })}
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
            {stringGetter({ key: STRING_KEYS.CLEAR_ALL })}
          </Button>
        </$FooterToolbar>
      }
      placement={placement}
      preventClose={isTablet}
    />
  );
};

const $ComboboxDialogMenu = styled(ComboboxDialogMenu)`
  --comboboxDialogMenu-item-padding: 0;

  [cmdk-list] > [cmdk-list-sizer] > * {
    box-shadow: none;
  }
`;

const $UnreadIndicator = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--color-accent);
  border: 1px solid var(--color-layer-2);
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
