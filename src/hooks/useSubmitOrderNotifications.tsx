import { createContext, useContext, useCallback, useState } from 'react';

import {
  SubmitOrderNotificationTypes,
  type SubmitOrderNotification,
} from '@/constants/notifications';

const SubmitOrderNotificationsContext = createContext<
  ReturnType<typeof useSubmitOrderNotificationsContext> | undefined
>(undefined);

SubmitOrderNotificationsContext.displayName = 'SubmitOrderNotifications';

export const SubmitOrderNotificationsProvider = ({ ...props }) => (
  <SubmitOrderNotificationsContext.Provider
    value={useSubmitOrderNotificationsContext()}
    {...props}
  />
);

export const useSubmitOrderNotifications = () => useContext(SubmitOrderNotificationsContext)!;

export const getSubmitOrderNotificationId = ({
  type,
  orderClientId,
}: {
  type: SubmitOrderNotificationTypes;
  orderClientId: Number;
}) => `${type}-order-${orderClientId}`;

const useSubmitOrderNotificationsContext = () => {
  const [submitOrderNotifications, setSubmitOrderNotifications] = useState<
    SubmitOrderNotification[]
  >([]);

  const addSubmitOrderNotification = useCallback(
    (notification: SubmitOrderNotification) =>
      setSubmitOrderNotifications((notifications) => [...notifications, notification]),
    [submitOrderNotifications]
  );

  const replaceOrderNotification = useCallback(
    (existingOrderNotificationIdx: number, newNotification: SubmitOrderNotification) => {
      const existingNotifications = [...submitOrderNotifications];
      existingNotifications.splice(existingOrderNotificationIdx, 1)[0];
      setSubmitOrderNotifications([...existingNotifications, newNotification]);
    },
    [submitOrderNotifications]
  );

  const addOrUpdateSubmitOrderNotification = useCallback(
    (notification: SubmitOrderNotification) => {
      const { orderClientId } = notification;
      const existingNotifications = [...submitOrderNotifications];
      const existingOrderNotificationIdx = existingNotifications.findIndex(
        (notification) => notification.orderClientId === orderClientId
      );

      if (existingOrderNotificationIdx !== undefined) {
        replaceOrderNotification(existingOrderNotificationIdx, notification);
      } else {
        addSubmitOrderNotification(notification);
      }
    },
    [submitOrderNotifications]
  );

  return {
    submitOrderNotifications,
    addOrUpdateSubmitOrderNotification,
  };
};
