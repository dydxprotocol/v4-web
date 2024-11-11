import { useCallback } from 'react';

import { DEFAULT_TOAST_AUTO_CLOSE_MS, NotificationDisplayData } from '@/constants/notifications';

import { useAppDispatch } from '@/state/appTypes';
import { addCustomNotification } from '@/state/notifications';

type CustomNoticationOptions = {
  id: string;
  toastDuration?: number;
};

export const useCustomNotification = () => {
  const dispatch = useAppDispatch();

  const notify = useCallback(
    (
      customNotification: Omit<NotificationDisplayData, 'groupKey'>,
      options?: CustomNoticationOptions
    ) => {
      const id = options?.id ?? Date.now().toString();
      dispatch(
        addCustomNotification({
          id,
          displayData: {
            toastDuration: options?.toastDuration ?? DEFAULT_TOAST_AUTO_CLOSE_MS,
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
