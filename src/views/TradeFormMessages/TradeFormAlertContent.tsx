import { ValidationError } from '@/bonsai/lib/validationErrors';

import { AlertType } from '@/constants/alerts';

import { AlertMessage } from '@/components/AlertMessage';
import { ValidationAlertMessage } from '@/components/ValidationAlert';

export const TradeFormAlertContent = ({
  placeOrderError,
  isErrorShownInOrderStatusToast,
  primaryAlert,
}: {
  placeOrderError?: string;
  isErrorShownInOrderStatusToast: boolean;
  primaryAlert?: ValidationError;
}) => {
  return placeOrderError != null && !isErrorShownInOrderStatusToast ? (
    <AlertMessage type={AlertType.Error}>
      <div tw="inline-block">{placeOrderError}</div>
    </AlertMessage>
  ) : primaryAlert != null && primaryAlert.resources.text?.stringKey != null ? (
    <ValidationAlertMessage error={primaryAlert} />
  ) : null;
};
