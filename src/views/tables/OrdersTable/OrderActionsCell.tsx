import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { AbacusOrderStatus, type OrderStatus } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';

import { useSubaccount } from '@/hooks';

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
        <Styled.CancelButton
          iconName={IconName.Close}
          shape={ButtonShape.Square}
          {...(isOrderStatusClearable(status)
            ? { onClick: () => dispatch(clearOrder(orderId)) }
            : {
                onClick: onCancel,
                state: {
                  isLoading: isCanceling || status === AbacusOrderStatus.canceling,
                  isDisabled: isCanceling || isDisabled || status === AbacusOrderStatus.canceling,
                },
              })}
        />
      </Styled.Toolbar>
    </Styled.OrderActions>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.OrderActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

Styled.Toolbar = styled(Toolbar)`
  width: 3rem;
  padding: 0;

  display: flex;
  justify-content: flex-end;
`;

Styled.CancelButton = styled(IconButton)`
  --button-hover-textColor: var(--color-red);

  svg {
    width: 0.875em;
    height: 0.875em;
  }
`;
