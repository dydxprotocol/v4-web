import { TradeFormType } from '@/bonsai/forms/trade/types';
import { ValidationError } from '@/bonsai/lib/validationErrors';
import styled from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';

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

  return (
    <>
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
