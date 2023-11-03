import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { LOCAL_STORAGE_VERSIONS, LocalStorageKey } from '@/constants/localStorage';
import {
  type Notification,
  type NotificationDisplayData,
  type NotificationPreferences,
  type Notifications,
  NotificationStatus,
  NotificationType,
} from '@/constants/notifications';

import { useLocalStorage } from './useLocalStorage';
import { notificationTypes } from './useNotificationTypes';

import { renderSvgToDataUrl } from '../lib/renderSvgToDataUrl';

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
    defaultValue: {
      notifications: {},
      version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.Notifications],
    },
  });

  const [notificationsLastUpdated, setNotificationsLastUpdated] = useLocalStorage<number>({
    key: LocalStorageKey.NotificationsLastUpdated,
    defaultValue: Date.now(),
  });

  const [notificationPreferences, setNotificationPreferences] =
    useLocalStorage<NotificationPreferences>({
      key: LocalStorageKey.NotificationPreferences,
      defaultValue: {
        [NotificationType.OrderStatusChanged]: true,
        [NotificationType.SquidTransfer]: true,
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.NotificationPreferences],
      },
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

  // Check for version changes
  useEffect(() => {
    if (notifications.version !== LOCAL_STORAGE_VERSIONS[LocalStorageKey.Notifications]) {
      setNotifications({
        notifications: {},
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.Notifications],
      });
    }

    if (
      notificationPreferences.version !==
      LOCAL_STORAGE_VERSIONS[LocalStorageKey.NotificationPreferences]
    ) {
      setNotificationPreferences({
        [NotificationType.OrderStatusChanged]: true,
        [NotificationType.SquidTransfer]: true,
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.NotificationPreferences],
      });
    }
  }, []);

  // Status changes
  const updateStatus = useCallback(
    (notification: Notification, status: NotificationStatus) => {
      notification.status = status;
      notification.timestamps[notification.status] = Date.now();
      setNotifications({
        notifications: notifications.notifications,
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.Notifications],
      } as Notifications);
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
    for (const notification of Object.values(notifications.notifications)) {
      markCleared(notification);
    }
  }, [notifications, markCleared]);

  // Trigger
  for (const { type, useTrigger } of notificationTypes)
    useTrigger({
      trigger: useCallback(
        (id, displayData, updateKey, isNew = true) => {
          const key = getKey({ type, id });

          const notification = notifications.notifications[key];

          // Filter out notifications that are not enabled
          if (notificationPreferences[type] !== false) {
            // New unique key - create new notification
            if (!notification) {
              const notification = (notifications.notifications[key] = {
                id,
                type,
                timestamps: {},
                updateKey,
              } as Notification);

              updateStatus(
                notification,
                isNew ? NotificationStatus.Triggered : NotificationStatus.Cleared
              );
            } else if (JSON.stringify(updateKey) !== JSON.stringify(notification.updateKey)) {
              // updateKey changed - update existing notification

              const notification = notifications.notifications[key];

              notification.updateKey = updateKey;
              updateStatus(notification, NotificationStatus.Updated);
            }
          } else {
            // Notification is disabled - remove it
            delete notifications.notifications[key];
          }

          // if (notificationPreferences[type] !== false) {
          notificationsDisplayData[key] = displayData;
          setNotificationsDisplayData({ ...notificationsDisplayData });
          // }
        },
        [notificationsDisplayData, notifications, updateStatus, notificationPreferences[type]]
      ),

      lastUpdated: notificationsLastUpdated,
    });

  // Actions
  const actions = useMemo(
    () =>
      Object.fromEntries(
        notificationTypes.map(
          ({ type, useNotificationAction }) => [type, useNotificationAction?.()] as const
        )
      ),
    [notificationTypes]
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

      for (const notification of Object.values(notifications.notifications))
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
            description: displayData.body,
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
    notifications: notifications.notifications,
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

    // Notification Preferences
    notificationPreferences,
    setNotificationPreferences,
    getNotificationPreferenceForType: useCallback(
      (type: NotificationType) => notificationPreferences[type],
      [notificationPreferences]
    ),
  };
};
