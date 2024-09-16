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

export const CancelOrClearAllOrdersButton = ({ marketId }: ElementProps) => {
  const { cancelAllOrders } = useSubaccount();
  const dispatch = useDispatch();
  const hasCancelableOrders = useParameterizedSelector(calculateHasCancelableOrders, marketId);

  const onCancelAll = useCallback(() => {
    cancelAllOrders(marketId);
  }, [cancelAllOrders, marketId]);

  const onClearAll = useCallback(() => {
    dispatch(clearAllOrders(marketId));
  }, [dispatch, marketId]);

  // TODO(@aforaleka): Localize strings
  // TODO(@aforaleka): add cancel all confirmation dialog
  return hasCancelableOrders ? (
    <$CancelAllButton action={ButtonAction.Primary} size={ButtonSize.XSmall} onClick={onCancelAll}>
      Cancel All
    </$CancelAllButton>
  ) : (
    <$ActionTextButton action={ButtonAction.Primary} size={ButtonSize.XSmall} onClick={onClearAll}>
      Clear All
    </$ActionTextButton>
  );
};

const $ActionTextButton = styled(Button)`
  --button-textColor: initial;
  --button-height: var(--item-height);
  --button-padding: 0 0.25rem;
  --button-backgroundColor: transparent;
  --button-border: none;

  pointer-events: auto;
`;

const $CancelAllButton = styled($ActionTextButton)<{ disabled?: boolean }>`
  ${({ disabled }) =>
    !disabled &&
    css`
      --button-textColor: var(--color-accent);
    `}
`;
