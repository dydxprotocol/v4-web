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
  NotificationCategoryPreferences,
  NotificationStatus,
  NotificationType,
  NotificationTypeCategory,
  SingleSessionNotificationTypes,
  type Notification,
  type NotificationDisplayData,
  type NotificationPreferences,
  type Notifications,
} from '@/constants/notifications';

import { track } from '@/lib/analytics';
import { renderSvgToDataUrl } from '@/lib/renderSvgToDataUrl';

import { useLocalStorage } from './useLocalStorage';
// eslint-disable-next-line import/no-cycle
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
        [NotificationCategoryPreferences.General]: true,
        [NotificationCategoryPreferences.Transfers]: true,
        [NotificationCategoryPreferences.Trading]: true,
        [NotificationCategoryPreferences.MustSee]: true,
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.NotificationPreferences],
      },
    });

  useEffect(() => {
    setNotificationsLastUpdated(Date.now());
  }, [notifications, setNotificationsLastUpdated]);

  useEffect(() => {
    // save notifications to localstorage, but filter out single session notifications
    const originalEntries = Object.entries(notifications);
    const filteredEntries = originalEntries.filter(
      ([, value]) => !SingleSessionNotificationTypes.includes(value.type)
    );

    const newNotifications = Object.fromEntries(filteredEntries);
    setLocalStorageNotifications(newNotifications);
  }, [notifications, setLocalStorageNotifications]);

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
    [getKey, notificationsDisplayData]
  );

  // Check for version changes
  useEffect(() => {
    if (
      notificationPreferences.version !==
      LOCAL_STORAGE_VERSIONS[LocalStorageKey.NotificationPreferences]
    ) {
      setNotificationPreferences({
        [NotificationCategoryPreferences.General]: true,
        [NotificationCategoryPreferences.Transfers]: true,
        [NotificationCategoryPreferences.Trading]: true,
        [NotificationCategoryPreferences.MustSee]: true,
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.NotificationPreferences],
      });
    }
  }, []);

  // Status changes
  const updateStatus = useCallback(
    (notification: Notification, status: NotificationStatus) => {
      notification.status = status;
      notification.timestamps[notification.status] = Date.now();
      setNotifications((ns) => ({
        ...ns,
        [getKey(notification)]: notification,
      }));
    },
    [getKey]
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
    Object.values(notifications).forEach((n) => markCleared(n));
  }, [notifications, markCleared]);

  // Trigger
  // eslint-disable-next-line no-restricted-syntax
  for (const { type, useTrigger } of notificationTypes) {
    const notificationCategory = NotificationTypeCategory[type];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTrigger({
      // eslint-disable-next-line react-hooks/rules-of-hooks
      trigger: useCallback(
        (id, displayData, updateKey, isNew = true) => {
          const key = getKey({ type, id });

          const notification = notifications[key];

          // Filter out notifications that are not enabled
          if (notificationPreferences[notificationCategory] !== false) {
            // New unique key - create new notification
            if (!notification) {
              const newStatus = isNew ? NotificationStatus.Triggered : NotificationStatus.Cleared;
              const thisNotification: Notification = (notifications[key] = {
                id,
                type,
                timestamps: {},
                status: newStatus,
                updateKey,
              });
              updateStatus(thisNotification, newStatus);
            } else if (JSON.stringify(updateKey) !== JSON.stringify(notification.updateKey)) {
              // updateKey changed - update existing notification
              const thisNotification = notifications[key];

              thisNotification.updateKey = updateKey;
              updateStatus(thisNotification, NotificationStatus.Updated);
            }
          } else {
            // Notification is disabled - remove it
            delete notifications[key];
          }

          notificationsDisplayData[key] = displayData;
          setNotificationsDisplayData({ ...notificationsDisplayData });
        },
        [notifications, updateStatus, notificationPreferences[notificationCategory]]
      ),

      lastUpdated: notificationsLastUpdated,
    });
  }

  // Actions
  const actions = Object.fromEntries(
    notificationTypes.map(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ({ type, useNotificationAction }) => [type, useNotificationAction?.()] as const
    )
  );

  const onNotificationAction = (notification: Notification) => {
    track(AnalyticsEvent.NotificationAction, { type: notification.type, id: notification.id });
    return actions[notification.type]?.(notification.id);
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

      // eslint-disable-next-line no-restricted-syntax
      for (const notification of Object.values(notifications))
        if (
          notification.status < NotificationStatus.Seen &&
          notification.timestamps[notification.status]! > pushNotificationsLastUpdated &&
          !globalThis.document.hasFocus()
        ) {
          const displayData = getDisplayData(notification);

          const iconUrl =
            displayData.icon &&
            // eslint-disable-next-line no-await-in-loop
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
          } as any);

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
      (type: NotificationType) => notificationPreferences[NotificationTypeCategory[type]],
      [notificationPreferences]
    ),
  };
};
