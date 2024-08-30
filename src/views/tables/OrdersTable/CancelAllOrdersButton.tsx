import { useCallback } from 'react';

import { useDispatch } from 'react-redux';
import styled, { css } from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useSubaccount } from '@/hooks/useSubaccount';

import { Button } from '@/components/Button';

import { clearAllOrders } from '@/state/account';
import { calculateHasCancelableOrders } from '@/state/accountCalculators';

type ElementProps = {
  marketId?: string;
};

export const CancelAllOrdersButton = ({ marketId }: ElementProps) => {
  const { cancelAllOrders } = useSubaccount();
  const dispatch = useDispatch();
  const hasCancelableOrders = useParameterizedSelector(calculateHasCancelableOrders, marketId);

  const onCancelOrClearAll = useCallback(() => {
    if (hasCancelableOrders) {
      cancelAllOrders(marketId);
    } else {
      dispatch(clearAllOrders(marketId));
    }
  }, [dispatch, hasCancelableOrders, cancelAllOrders, marketId]);

  // TODO(@aforaleka): Localize strings
  // TODO(@aforaleka): add cancel all confirmation dialog
  return (
    <$CancelAllButton
      action={ButtonAction.Primary}
      size={ButtonSize.XSmall}
      onClick={onCancelOrClearAll}
    >
      {hasCancelableOrders ? 'Cancel All' : 'Clear All'}
    </$CancelAllButton>
  );
};

const $CancelAllButton = styled(Button)<{ disabled?: boolean }>`
  --button-height: var(--item-height);
  --button-padding: 0;
  --button-textColor: var(--color-accent);
  --button-backgroundColor: transparent;
  --button-border: none;

  pointer-events: auto;

  ${({ disabled }) =>
    disabled &&
    css`
      --button-textColor: initial;
    `}
`;
