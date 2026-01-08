import { TradeFormType } from '@/bonsai/forms/trade/types';
import { ValidationError } from '@/bonsai/lib/validationErrors';
import { ComplianceStatus } from '@dydxprotocol/v4-client-js';
import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';

import { useComplianceState } from '@/hooks/useComplianceState';

import { AlertMessage } from '@/components/AlertMessage';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { useAppDispatch } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';

import { TradeFormAlertContent } from './TradeFormAlertContent';

export const TradeFormMessages = ({
  isErrorShownInOrderStatusToast,
  placeOrderError,
  primaryAlert,
  shouldPromptUserToPlaceLimitOrder,
}: {
  isErrorShownInOrderStatusToast: boolean;
  placeOrderError?: string;
  primaryAlert?: ValidationError;
  shouldPromptUserToPlaceLimitOrder: boolean;
}) => {
  const dispatch = useAppDispatch();
  const { complianceMessage, complianceStatus } = useComplianceState();

  return (
    <>
      {complianceStatus === ComplianceStatus.CLOSE_ONLY && (
        <AlertMessage type={AlertType.Error}>
          <span>{complianceMessage}</span>
        </AlertMessage>
      )}

      <TradeFormAlertContent
        placeOrderError={placeOrderError}
        isErrorShownInOrderStatusToast={isErrorShownInOrderStatusToast}
        primaryAlert={primaryAlert}
      />

      {shouldPromptUserToPlaceLimitOrder && (
        <$IconButton
          iconName={IconName.Arrow}
          shape={ButtonShape.Circle}
          action={ButtonAction.Navigation}
          size={ButtonSize.XSmall}
          iconSize="1.25em"
          onClick={() => dispatch(tradeFormActions.setOrderType(TradeFormType.LIMIT))}
        />
      )}
    </>
  );
};

const $IconButton = styled(IconButton)`
  --button-backgroundColor: var(--color-white-faded);
  flex-shrink: 0;
`;
