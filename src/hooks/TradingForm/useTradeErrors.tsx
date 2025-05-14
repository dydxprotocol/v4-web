import { useMemo } from 'react';

import { ErrorType, getHighestPriorityAlert } from '@/bonsai/lib/validationErrors';

import { AlertType } from '@/constants/alerts';
import { NotificationType } from '@/constants/notifications';

import { AlertMessage } from '@/components/AlertMessage';
import { ValidationAlertMessage } from '@/components/ValidationAlert';

import { useAppSelector } from '@/state/appTypes';
import { getTradeFormSummary } from '@/state/tradeFormSelectors';

import { useDisappearingValue } from '@/lib/disappearingValue';

import { useNotifications } from '../useNotifications';

export const useTradeErrors = () => {
  const [placeOrderError, setPlaceOrderError] = useDisappearingValue<string>();
  const { errors: tradeErrors } = useAppSelector(getTradeFormSummary);
  const { getNotificationPreferenceForType } = useNotifications();

  const { alertContent, shortAlertKey, shouldPromptUserToPlaceLimitOrder, alertType, inputAlert } =
    useMemo(() => {
      const primaryAlert = getHighestPriorityAlert(tradeErrors);

      const isErrorShownInOrderStatusToast = getNotificationPreferenceForType(
        NotificationType.OrderStatus
      );

      const shouldPromptUserToPlaceLimitOrderInner =
        primaryAlert?.code === 'MARKET_ORDER_ERROR_ORDERBOOK_SLIPPAGE';

      return {
        shortAlertKey: primaryAlert?.resources.title?.stringKey,
        alertContent:
          placeOrderError != null && !isErrorShownInOrderStatusToast ? (
            <AlertMessage type={AlertType.Error}>
              <div tw="inline-block">{placeOrderError}</div>
            </AlertMessage>
          ) : primaryAlert != null && primaryAlert.resources.text?.stringKey != null ? (
            <ValidationAlertMessage error={primaryAlert} />
          ) : undefined,
        alertType:
          placeOrderError != null && !isErrorShownInOrderStatusToast
            ? ErrorType.error
            : primaryAlert?.type,
        shouldPromptUserToPlaceLimitOrder: shouldPromptUserToPlaceLimitOrderInner,
        inputAlert: primaryAlert,
      };
    }, [getNotificationPreferenceForType, placeOrderError, tradeErrors]);

  return {
    placeOrderError,
    setPlaceOrderError,
    alertContent,
    shortAlertKey,
    shouldPromptUserToPlaceLimitOrder,
    alertType,
    inputAlert,
  };
};
