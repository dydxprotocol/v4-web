import { useMemo } from 'react';

import { useStringGetter } from '@/hooks/useStringGetter';

import { ErrorExclamationIcon } from '@/icons';
import ExchangeIcon from '@/icons/exchange.svg';

import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
// eslint-disable-next-line import/no-cycle
import { Notification, type NotificationProps } from '@/components/Notification';

import type { Swap } from '@/state/swaps';

type SwapNotificationProps = {
  swap: Swap;
};

export const SwapNotification = ({
  swap,
  notification,
  isToast,
}: SwapNotificationProps & NotificationProps) => {
  const stringGetter = useStringGetter();

  const [icon, title] = useMemo(() => {
    switch (swap.status) {
      case 'pending':
      case 'pending-transfer':
        return [<LoadingSpinner tw="h-1 w-1" key="loading-icon" />, 'Swapping'];
      case 'success':
        return [<ExchangeIcon key="success-icon" />, stringGetter({ key: 'SWAP_SUCCESS' })];
      case 'error':
        return [<ErrorExclamationIcon key="error-icon" />, 'Error swapping tokens'];
      default:
        return [null, ''];
    }
  }, [swap.status, stringGetter]);

  const description = useMemo(() => {
    switch (swap.status) {
      case 'pending':
      case 'pending-transfer':
        return `Swapping `;
      case 'success':
        return `Successfully swapped `;
      case 'error':
        return 'Unable to swap tokens at this time. Please try again.';
      default:
        return '';
    }
  }, [swap]);

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotTitle={title}
      slotIcon={icon}
      slotDescription={<span>{description}</span>}
    />
  );
};
