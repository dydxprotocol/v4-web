import { useCallback, useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { AbacusOrderStatus, type OrderStatus } from '@/constants/abacus';

import { useSubaccount } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Toolbar } from '@/components/Toolbar';

import { clearOrder } from '@/state/account';

import { isOrderStatusClearable } from '@/lib/orders';

type ElementProps = {
  orderId: string;
  status: OrderStatus;
  isDisabled?: boolean;
};

export const OrderActionsCell = ({ orderId, status, isDisabled }: ElementProps) => {
  const dispatch = useDispatch();
  const [isCanceling, setIsCanceling] = useState(false);

  const { cancelOrder } = useSubaccount();

  const onCancel = useCallback(async () => {
    setIsCanceling(true);
    await cancelOrder({ orderId, onError: () => setIsCanceling(false) });
  }, []);

  return (
    <Styled.OrderActions>
      <Styled.Toolbar>
        {isOrderStatusClearable(status) ? (
          <Styled.ActionButton
            iconName={IconName.Close}
            onClick={() => dispatch(clearOrder(orderId))}
          />
        ) : (
          <Styled.CancelButton
            iconName={IconName.Close}
            state={{
              isLoading: isCanceling || status === AbacusOrderStatus.canceling,
              isDisabled: isCanceling || isDisabled || status === AbacusOrderStatus.canceling,
            }}
            onClick={onCancel}
          />
        )}
      </Styled.Toolbar>
    </Styled.OrderActions>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.OrderActions = styled.div`
  ${layoutMixins.row};
  justify-content: var(--table-cell-currentAlign);
`;

Styled.Toolbar = styled(Toolbar)`
  width: 3rem;

  padding: 0;
  display: flex;
  justify-content: center;
`;

Styled.ActionButton = styled(IconButton)`
  --button-backgroundColor: transparent;
  --button-border: none;

  svg {
    width: 0.875em;
    height: 0.875em;
  }
`;

Styled.CancelButton = styled(Styled.ActionButton)`
  &:not(:disabled) {
    --button-textColor: var(--color-negative);
  }
`;
