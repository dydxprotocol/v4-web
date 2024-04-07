import {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { AnalyticsEvent } from '@/constants/analytics';
import { LOCAL_STORAGE_VERSIONS, LocalStorageKey } from '@/constants/localStorage';
import {
  type Notification,
  type NotificationDisplayData,
  type NotificationPreferences,
  type Notifications,
  NotificationStatus,
  NotificationType,
  SingleSessionNotificationTypes,
} from '@/constants/notifications';

import { track } from '@/lib/analytics';
import { renderSvgToDataUrl } from '@/lib/renderSvgToDataUrl';

import { useLocalStorage } from './useLocalStorage';
import { notificationTypes } from './useNotificationTypes';

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
  const [localStorageNotifications, setLocalStorageNotifications] = useLocalStorage<Notifications>({
    key: LocalStorageKey.Notifications,
    defaultValue: {},
  });
  const [notifications, setNotifications] = useState<Notifications>(localStorageNotifications);

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
        [NotificationType.TriggerOrder]: true,
        [NotificationType.ReleaseUpdates]: true,
        [NotificationType.ApiError]: true,
        [NotificationType.ComplianceAlert]: true,
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.NotificationPreferences],
      },
    });

  useEffect(() => {
    setNotificationsLastUpdated(Date.now());
  }, [notifications]);

  useEffect(() => {
    // save notifications to localstorage, but filter out single session notifications
    const originalEntries = Object.entries(notifications);
    const filteredEntries = originalEntries.filter(
      ([, value]) => !SingleSessionNotificationTypes.includes(value.type)
    );

    const newNotifications = Object.fromEntries(filteredEntries);
    setLocalStorageNotifications(newNotifications);
  }, [notifications]);

  const clearAbacusGeneratedNotifications = useCallback(
    (notifications: Notifications) => {
      const originalEntries = Object.entries(notifications);
      const filteredEntries = originalEntries.filter(
        ([, value]) => value.type !== NotificationType.AbacusGenerated
      );

      // Only update if the number of notifications has changed
      if (filteredEntries.length !== originalEntries.length) {
        const newNotifications = Object.fromEntries(filteredEntries);
        setNotifications(newNotifications);
      }
    },
    [notifications]
  );

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
        [NotificationType.TriggerOrder]: true,
        [NotificationType.ApiError]: true,
        [NotificationType.ComplianceAlert]: true,
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
            displayData.icon &&
            (await renderSvgToDataUrl(displayData.icon as ReactElement<any, 'svg'>).catch(
              () => undefined
            ));

          const pushNotification = new globalThis.Notification(displayData.title, {
            renotify: true,
            tag: getKey(notification),
            data: notification,
            body: displayData.body,
            icon: iconUrl?.toString() ?? '/favicon.svg',
            badge: iconUrl?.toString() ?? '/favicon.svg',
            image: iconUrl?.toString() ?? '/favicon.svg',
            vibrate: displayData.toastSensitivity === 'foreground' ? 200 : undefined,
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
