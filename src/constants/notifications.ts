import { StatusResponse } from '@0xsquid/sdk';

/** implemented in useNotificationTypes */
export enum NotificationType {
  AbacusGenerated = 'AbacusGenerated',
  SquidTransfer = 'SquidTransfer',
  ReleaseUpdates = 'ReleaseUpdates',
}

export enum NotificationComponentType {}

export type NotificationId = string | number;

export type NotificationTypeConfig<
  NotificationIdType extends NotificationId = string,
  NotificationUpdateKey = any
> = {
  type: NotificationType;

  /** React hook to trigger notifications based on app state */
  useTrigger: (_: {
    trigger: (
      /** Unique ID for the triggered notification */
      id: NotificationIdType,

      /** Display data for the triggered notification */
      displayData: NotificationDisplayData,

      /**
       * JSON-serializable key.
       * Re-triggers the notification if passed a different value from the last trigger() call (even from a previous browser session).
       * Suggested usage: data dependency array
       */
      updateKey?: NotificationUpdateKey,

      /**
       * @param true (default): Notification initialized with status NotificationStatus.Triggered
       * @param false: Notification initialized with status NotificationStatus.Cleared
       */
      isNew?: boolean
    ) => void;

    lastUpdated: number;
  }) => void;

  /** Callback for notification action (Toast action button click, NotificationsMenu item click, or native push notification interaction) */
  useNotificationAction?: () => (id: NotificationIdType) => any;
};

export enum NotificationStatus {
  /** Notification triggered for the first time. Toast timer started. "New" in NotificationsMenu. */
  Triggered,

  /** Notification re-triggered with a different NotificationUpdateKey. Toast timer restarted. "New" in NotificationsMenu. */
  Updated,

  /** Toast timer expired without user interaction. "New" in NotificationsMenu. */
  Unseen,

  /** Toast or NotificationsMenu item interacted with or dismissed. "Seen" in NotificationsMenu. */
  Seen,

  /** Notification marked for deletion. Hidden in NotificationsMenu. */
  Cleared,
}

/** Notification state. Serialized and cached into localStorage. */
export type Notification<
  NotificationIdType extends NotificationId = string,
  NotificationUpdateKey = any
> = {
  id: NotificationIdType;
  type: NotificationType;
  status: NotificationStatus;
  timestamps: Partial<Record<NotificationStatus, number>>;
  updateKey: NotificationUpdateKey;
};

export type Notifications = Record<NotificationId, Notification<any>>;

/** Notification display data derived from app state at runtime. */
export type NotificationDisplayData = {
  icon?: React.ReactNode;
  title: string; // Title for Toast, Notification, and Push Notification
  body?: string; // Description body for Toast, Notification, and Push Notification

  slotTitleLeft?: React.ReactNode;
  slotTitleRight?: React.ReactNode;

  groupKey: string; // Grouping key toast notification stacking

  // Overrides title/body for Notification in NotificationMenu
  renderCustomBody?: ({
    isToast,
    notification,
  }: {
    isToast?: boolean;
    notification: Notification;
  }) => React.ReactNode; // Custom Notification

  actionDescription?: string;

  /** Screen reader: instructions for performing toast action after its timer expires */
  actionAltText?: string;

  /**
   * @param foreground
     Screen reader: announces immediately.
     Push notification: vibrates device.
   * @param background
     Screen reader: announces at the next graceful opportunity.
     Push notification: no vibration.
   */
  toastSensitivity?: 'foreground' | 'background';

  /**
   * @param number
     Radix UI Toast: automatically Unseen.
     Push notification: requires interaction.
   * @param Infinity
     Radix UI Toast: no timer.
     Push notification: requires interaction.
   */
  toastDuration?: number;
};

export enum TransferNotificationTypes {
  Withdrawal = 'withdrawal',
  Deposit = 'deposit',
}

// Notification types
export type TransferNotifcation = {
  txHash: string;
  type?: TransferNotificationTypes;
  toChainId?: string;
  fromChainId?: string;
  toAmount?: number;
  triggeredAt?: number;
  isCctp?: boolean;
  errorCount?: number;
  status?: StatusResponse;
  isExchange?: boolean;
};

export enum ReleaseUpdateNotificationIds {
  IncentivesS3 = 'incentives-s3',
  IncentivesDistributedS2 = 'incentives-distributed-s2',
}

/**
 * @description Struct to store whether a NotificationType should be triggered
 */
export type NotificationPreferences = {
  [key in NotificationType]: boolean;
} & { version: string };

export const DEFAULT_TOAST_AUTO_CLOSE_MS = 5000;
