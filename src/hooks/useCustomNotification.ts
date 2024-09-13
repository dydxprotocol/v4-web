import { useCallback } from 'react';

import { DEFAULT_TOAST_AUTO_CLOSE_MS, NotificationDisplayData } from '@/constants/notifications';

import { useAppDispatch } from '@/state/appTypes';
import { addCustomNotification } from '@/state/notifications';

export const useCustomNotification = () => {
  const dispatch = useAppDispatch();

  const notify = useCallback(
    (customNotification: Omit<NotificationDisplayData, 'groupKey'>) => {
      const id = Date.now().toString();
      dispatch(
        addCustomNotification({
          id,
          displayData: {
            toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
            groupKey: id,
            ...customNotification,
          },
        })
      );
    },
    [dispatch]
  );

  return notify;
};
