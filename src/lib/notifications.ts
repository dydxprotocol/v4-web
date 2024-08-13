import { AbacusNotification } from '@/constants/abacus';
import { SingleSessionAbacusNotificationTypes } from '@/constants/notifications';

export const isAbacusNotificationSingleSession = (notification: AbacusNotification) => {
  const notificationType = notification.id.split(':')[0];
  return SingleSessionAbacusNotificationTypes.includes(notificationType);
};
