import { SingleSessionAbacusNotificationTypes } from '@/constants/notifications';

export const isAbacusNotificationSingleSession = (notificationId: string) => {
  const notificationType = notificationId.split(':')[0];
  return SingleSessionAbacusNotificationTypes.includes(notificationType);
};
