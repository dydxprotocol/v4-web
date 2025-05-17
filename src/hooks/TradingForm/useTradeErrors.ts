import { useMemo } from 'react';

import { ErrorType, getHighestPriorityAlert } from '@/bonsai/lib/validationErrors';

import { NotificationType } from '@/constants/notifications';

import { useAppSelector } from '@/state/appTypes';
import { getTradeFormSummary } from '@/state/tradeFormSelectors';

import { useNotifications } from '../useNotifications';

export const useTradeErrors = ({ placeOrderError }: { placeOrderError?: string }) => {
  const { errors: tradeErrors } = useAppSelector(getTradeFormSummary);
  const { getNotificationPreferenceForType } = useNotifications();

  return useMemo(() => {
    const primaryAlert = getHighestPriorityAlert(tradeErrors);
    const isErrorShownInOrderStatusToast = getNotificationPreferenceForType(
      NotificationType.OrderStatus
    );
    const shouldPromptUserToPlaceLimitOrder =
      primaryAlert?.code === 'MARKET_ORDER_ERROR_ORDERBOOK_SLIPPAGE';

    return {
      shortAlertKey: primaryAlert?.resources.title?.stringKey,
      primaryAlert,
      isErrorShownInOrderStatusToast,
      alertType:
        placeOrderError != null && !isErrorShownInOrderStatusToast
          ? ErrorType.error
          : primaryAlert?.type,
      shouldPromptUserToPlaceLimitOrder,
    };
  }, [getNotificationPreferenceForType, placeOrderError, tradeErrors]);
};
