import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';

import { LocalStorageKey } from '@/constants/localStorage';
import {
  type Notification,
  type NotificationDisplayData,
  type Notifications,
  type TransferNotifcation,
  NotificationStatus,
} from '@/constants/notifications';

import { useSquid } from '@/hooks/useSquid';
import { useLocalStorage } from './useLocalStorage';
import { notificationTypes } from './useNotificationTypes';

import { renderSvgToDataUrl } from '../lib/renderSvgToDataUrl';
import { StatusResponse } from '@0xsquid/sdk';

const NotificationsContext = createContext<ReturnType<typeof useNotificationsContext> | undefined>(
  undefined
);

NotificationsContext.displayName = 'Notifications';

export const NotificationsProvider = ({ ...props }) => (
  <NotificationsContext.Provider value={useNotificationsContext()} {...props} />
);

export const useNotifications = () => useContext(NotificationsContext)!;

const useNotificationsContext = () => {
  // Local storage
  const [notifications, setNotifications] = useLocalStorage<Notifications>({
    key: LocalStorageKey.Notifications,
    defaultValue: {},
  });

  const [notificationsLastUpdated, setNotificationsLastUpdated] = useLocalStorage<number>({
    key: LocalStorageKey.NotificationsLastUpdated,
    defaultValue: Date.now(),
  });

  useEffect(() => {
    setNotificationsLastUpdated(Date.now());
  }, [notifications]);

  const getKey = <T extends string | number>(notification: Pick<Notification<T>, 'type' | 'id'>) =>
    `${notification.type}/${notification.id}`;

  // Display data
  const [notificationsDisplayData, setNotificationsDisplayData] = useState(
    {} as Record<string, NotificationDisplayData>
  );

  const getDisplayData = useCallback(
    (notification: Notification) => notificationsDisplayData[getKey(notification)],
    [notificationsDisplayData]
  );

  // Status changes
  const updateStatus = useCallback(
    (notification: Notification, status: NotificationStatus) => {
      notification.status = status;
      notification.timestamps[notification.status] = Date.now();
      setNotifications({ ...notifications });
    },
    [notifications]
  );

  const { markUnseen, markSeen, markCleared } = useMemo(
    () => ({
      markUnseen: (notification: Notification) => {
        if (notification.status < NotificationStatus.Unseen)
          updateStatus(notification, NotificationStatus.Unseen);
      },
      markSeen: (notification: Notification) => {
        if (notification.status < NotificationStatus.Seen)
          updateStatus(notification, NotificationStatus.Seen);
      },
      markCleared: (notification: Notification) => {
        if (notification.status < NotificationStatus.Cleared)
          updateStatus(notification, NotificationStatus.Cleared);
      },
    }),
    [updateStatus]
  );

  const markAllCleared = useCallback(() => {
    for (const notification of Object.values(notifications)) {
      markCleared(notification);
    }
  }, [notifications, markCleared]);

  // Trigger
  for (const { type, useTrigger } of notificationTypes)
    useTrigger({
      trigger: useCallback(
        (id, displayData, updateKey, isNew = true) => {
          const key = getKey({ type, id });

          const notification = notifications[key];

          // New unique key - create new notification
          if (!notification) {
            const notification = (notifications[key] = {
              id,
              type,
              timestamps: {},
              updateKey,
            } as Notification);

            updateStatus(
              notification,
              isNew ? NotificationStatus.Triggered : NotificationStatus.Cleared
            );
          }

          // updateKey changed - update existing notification
          else if (JSON.stringify(updateKey) !== JSON.stringify(notification.updateKey)) {
            const notification = notifications[key];

            notification.updateKey = updateKey;
            updateStatus(notification, NotificationStatus.Updated);
          }

          notificationsDisplayData[key] = displayData;
          setNotificationsDisplayData({ ...notificationsDisplayData });
        },
        [notifications, updateStatus]
      ),

      lastUpdated: notificationsLastUpdated,
    });

  // Actions
  const actions = Object.fromEntries(
    notificationTypes.map(
      ({ type, useNotificationAction }) => [type, useNotificationAction?.()] as const
    )
  );

  const onNotificationAction = useCallback(
    async (notification: Notification) => await actions[notification.type]?.(notification.id),
    [actions]
  );

  // Push notifications
  const [hasEnabledPush, setHasEnabledPush] = useLocalStorage({
    key: LocalStorageKey.PushNotificationsEnabled,
    defaultValue: Boolean(
      globalThis.Notification && globalThis.Notification.permission === 'granted'
    ),
  });
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  const [pushNotificationsLastUpdated, setPushNotificationsLastUpdated] = useLocalStorage({
    key: LocalStorageKey.PushNotificationsLastUpdated,
    defaultValue: Date.now(),
  });

  const enablePush = async () => {
    if (globalThis.Notification) {
      setIsEnablingPush(true);
      setHasEnabledPush((await globalThis.Notification.requestPermission()) === 'granted');
      setIsEnablingPush(false);
    }
  };

  const disablePush = () => {
    setHasEnabledPush(false);
  };

  useEffect(() => {
    (async () => {
      if (!hasEnabledPush) return;

      for (const notification of Object.values(notifications))
        if (
          notification.status < NotificationStatus.Seen &&
          notification.timestamps[notification.status]! > pushNotificationsLastUpdated &&
          !globalThis.document.hasFocus()
        ) {
          const displayData = getDisplayData(notification);

          const iconUrl =
            displayData.icon && (await renderSvgToDataUrl(displayData.icon).catch(() => undefined));

          const pushNotification = new globalThis.Notification(displayData.title, {
            renotify: true,
            tag: getKey(notification),
            data: notification,
            body: displayData.description,
            icon: iconUrl ?? '/favicon.svg',
            badge: iconUrl ?? '/favicon.svg',
            image: iconUrl ?? '/favicon.svg',
            vibrate: displayData.toastSensitivity === 'foreground',
            requireInteraction: displayData.toastDuration === Infinity,
            // actions: [
            //   {
            //     action: displayData.actionDescription,
            //     title: displayData.actionDescription,
            //   }
            // ].slice(0, globalThis.Notification.maxActions),
          });

          pushNotification.addEventListener('click', () => {
            onNotificationAction(notification);
            markSeen(notification);
          });
        }

      setPushNotificationsLastUpdated(Date.now());
    })();
  }, [hasEnabledPush, notifications, onNotificationAction, markSeen]);

  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Public
  return {
    notifications,
    /** Resolve key */
    getKey,
    /** Resolve associated NotificationDisplayData */
    getDisplayData,

    // Status changes
    markUnseen,
    markSeen,
    markCleared,
    markAllCleared,

    // Actions
    onNotificationAction,

    // Push notifications
    hasEnabledPush,
    isEnablingPush,
    enablePush,
    disablePush,

    // Menu state
    isMenuOpen,
    setIsMenuOpen,
  };
};
