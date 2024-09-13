import { useCallback } from 'react';

import { uniqueId } from 'lodash';

import {
  DEFAULT_TOAST_AUTO_CLOSE_MS,
  NotificationDisplayData,
  NotificationType,
} from '@/constants/notifications';

import { useAppDispatch } from '@/state/appTypes';
import { addCustomNotification } from '@/state/notifications';

export const useCustomNotification = () => {
  const dispatch = useAppDispatch();

  const notify = useCallback(
    (customNotification: Omit<NotificationDisplayData, 'groupKey'>) => {
      dispatch(
        addCustomNotification({
          id: uniqueId(),

          displayData: {
            toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
            groupKey: NotificationType.Custom,
            ...customNotification,
          },
        })
      );
    },
    [dispatch]
  );

  return notify;
};
