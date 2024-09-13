import { useCallback } from 'react';

import { uniqueId } from 'lodash';

import { NotificationDisplayData, NotificationType } from '@/constants/notifications';

import { useAppDispatch } from '@/state/appTypes';
import { addCustomNotification } from '@/state/notifications';

export const useCustomNotification = () => {
  const dispatch = useAppDispatch();

  const notify = useCallback(
    (customNotification: Omit<NotificationDisplayData, 'groupKey'>) => {
      dispatch(
        addCustomNotification({
          id: uniqueId(),
          displayData: { ...customNotification, groupKey: NotificationType.Custom },
        })
      );
    },
    [dispatch]
  );

  return notify;
};
