import { useCallback } from 'react';

import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';

import { calculateHasCancelableOrders } from '@/state/accountCalculators';
import { openDialog } from '@/state/dialogs';

type ElementProps = {
  marketId?: string;
};

export const CancelAllOrdersButton = ({ marketId }: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const hasCancelableOrders = useAppSelectorWithArgs(calculateHasCancelableOrders, marketId);

  const onCancelAll = useCallback(() => {
    if (hasCancelableOrders) {
      dispatch(openDialog(DialogTypes.CancelAllOrdersConfirmation({ marketId })));
    }
  }, [dispatch, hasCancelableOrders, marketId]);

  if (!hasCancelableOrders) {
    return null;
  }
  return (
    <$ActionTextButton
      action={ButtonAction.Primary}
      size={ButtonSize.XSmall}
      onClick={onCancelAll}
      isHighlighted={hasCancelableOrders}
    >
      {stringGetter({ key: STRING_KEYS.CANCEL_ALL })}
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
