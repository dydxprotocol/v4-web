import { useCallback } from 'react';

import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';

import { clearAllOrders } from '@/state/account';
import { calculateHasCancelableOrders } from '@/state/accountCalculators';
import { openDialog } from '@/state/dialogs';

type ElementProps = {
  marketId?: string;
};

export const CancelOrClearAllOrdersButton = ({ marketId }: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const hasCancelableOrders = useParameterizedSelector(calculateHasCancelableOrders, marketId);

  const onClearOrCancelAll = useCallback(() => {
    if (hasCancelableOrders) {
      dispatch(openDialog(DialogTypes.CancelAllOrdersConfirmation({ marketId })));
    } else {
      dispatch(clearAllOrders(marketId));
    }
  }, [dispatch, hasCancelableOrders, marketId]);

  return (
    <$ActionTextButton
      action={ButtonAction.Primary}
      size={ButtonSize.XSmall}
      onClick={onClearOrCancelAll}
      isHighlighted={hasCancelableOrders}
    >
      {stringGetter({ key: hasCancelableOrders ? STRING_KEYS.CANCEL_ALL : STRING_KEYS.CLEAR_ALL })}
    </$ActionTextButton>
  );
};

const $ActionTextButton = styled(Button)<{ isHighlighted?: boolean }>`
  --button-textColor: ${({ isHighlighted }) => (isHighlighted ? 'var(--color-red)' : 'initial')};
  --button-height: var(--item-height);
  --button-padding: 0 0.25rem;
  --button-backgroundColor: transparent;
  --button-border: none;

  pointer-events: auto;
`;
