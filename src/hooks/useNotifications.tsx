import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AnalyticsEvent } from '@/constants/analytics';
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

import { track } from '@/lib/analytics';
import { renderSvgToDataUrl } from '../lib/renderSvgToDataUrl';

type NotificationsContextType = ReturnType<typeof useNotificationsContext>;

const NotificationsContext = createContext<NotificationsContextType>(
  {} as NotificationsContextType
);

NotificationsContext.displayName = 'Notifications';

export const NotificationsProvider = ({ ...props }) => (
  <NotificationsContext.Provider value={useNotificationsContext()} {...props} />
);

export const useNotifications = () => useContext(NotificationsContext)!;

const useNotificationsContext = () => {
  // Local storage
  // const [notifications, setNotifications] = useState<Notifications>({});
  const [notifications, setNotifications] = useLocalStorage<Notifications>({
    key: LocalStorageKey.Notifications,
    defaultValue: {},
  });

  const [notificationsLastUpdated, setNotificationsLastUpdated] = useLocalStorage<number>({
    key: LocalStorageKey.NotificationsLastUpdated,
    defaultValue: Date.now(),
  });

  const [notificationPreferences, setNotificationPreferences] =
    useLocalStorage<NotificationPreferences>({
      key: LocalStorageKey.NotificationPreferences,
      defaultValue: {
        [NotificationType.AbacusGenerated]: true,
        [NotificationType.SquidTransfer]: true,
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.NotificationPreferences],
      },
    });

  useEffect(() => {
    setNotificationsLastUpdated(Date.now());
  }, [notifications]);

  const getKey = useCallback(
    <T extends string | number>(notification: Pick<Notification<T>, 'type' | 'id'>) =>
      `${notification.type}/${notification.id}`,
    []
  );

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
    if (
      notificationPreferences.version !==
      LOCAL_STORAGE_VERSIONS[LocalStorageKey.NotificationPreferences]
    ) {
      setNotificationPreferences({
        [NotificationType.AbacusGenerated]: true,
        [NotificationType.SquidTransfer]: true,
        [NotificationType.ReleaseUpdates]: true,
        [NotificationType.ChaosLabs]: true,
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.NotificationPreferences],
      });
    }
  }, []);

  // Status changes
  const updateStatus = useCallback(
    (notification: Notification, status: NotificationStatus) => {
      notification.status = status;
      notification.timestamps[notification.status] = Date.now();
      setNotifications({ ...notifications, [getKey(notification)]: notification });
    },
    [notifications, getKey]
  );

  const { markUnseen, markSeen, markCleared } = useMemo(
    () => ({
      markUnseen: (notification: Notification) => {
        if (notification.status < NotificationStatus.Unseen) {
          updateStatus(notification, NotificationStatus.Unseen);
        }
      },
      markSeen: (notification: Notification) => {
        if (notification.status < NotificationStatus.Seen) {
          updateStatus(notification, NotificationStatus.Seen);
        }
      },
      markCleared: (notification: Notification) => {
        if (notification.status < NotificationStatus.Cleared) {
          updateStatus(notification, NotificationStatus.Cleared);
        }
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

          // Filter out notifications that are not enabled
          if (notificationPreferences[type] !== false) {
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
            } else if (JSON.stringify(updateKey) !== JSON.stringify(notification.updateKey)) {
              // updateKey changed - update existing notification

              const notification = notifications[key];

              notification.updateKey = updateKey;
              updateStatus(notification, NotificationStatus.Updated);
            }
          } else {
            // Notification is disabled - remove it
            delete notifications[key];
          }

          notificationsDisplayData[key] = displayData;
          setNotificationsDisplayData({ ...notificationsDisplayData });
        },
        [notifications, updateStatus, notificationPreferences[type]]
      ),

      lastUpdated: notificationsLastUpdated,
    });

  // Actions
  const actions = Object.fromEntries(
    notificationTypes.map(
      ({ type, useNotificationAction }) => [type, useNotificationAction?.()] as const
    )
  );

  const onNotificationAction = async (notification: Notification) => {
    track(AnalyticsEvent.NotificationAction, { type: notification.type, id: notification.id });
    return await actions[notification.type]?.(notification.id);
  };

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
  }, [hasEnabledPush, notifications, markSeen]);

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

    // Notification Preferences
    notificationPreferences,
    setNotificationPreferences,
    getNotificationPreferenceForType: useCallback(
      (type: NotificationType) => notificationPreferences[type],
      [notificationPreferences]
    ),
  };
};
