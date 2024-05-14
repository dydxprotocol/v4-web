import { useCallback, useState } from 'react';

import { OrderFlags } from '@dydxprotocol/v4-client-js';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { AbacusOrderStatus, type OrderStatus } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';

import { useSubaccount } from '@/hooks/useSubaccount';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table';

import { clearOrder } from '@/state/account';
import { getOrderById } from '@/state/accountSelectors';

import { isOrderStatusClearable } from '@/lib/orders';

type ElementProps = {
  orderId: string;
  status: OrderStatus;
  isDisabled?: boolean;
};

export const OrderActionsCell = ({ orderId, status, isDisabled }: ElementProps) => {
  const dispatch = useDispatch();
  const order = useSelector(getOrderById(orderId), shallowEqual);

  const [isCanceling, setIsCanceling] = useState(false);

  const { cancelOrder } = useSubaccount();

  const onCancel = useCallback(async () => {
    setIsCanceling(true);
    cancelOrder({ orderId, onError: () => setIsCanceling(false) });
  }, []);

  // CT831: if order is stateful and is initially best effort canceled, it's a stuck order that
  // traders should be able to submit another cancel
  const isShortTermOrder = order?.orderFlags === OrderFlags.SHORT_TERM;
  const isBestEffortCanceled = status === AbacusOrderStatus.canceling;
  const isCancelDisabled =
    isCanceling || !!isDisabled || !order || (isShortTermOrder && isBestEffortCanceled);

  return (
    <ActionsTableCell>
      <$CancelButton
        key="cancelorder"
        iconName={IconName.Close}
        shape={ButtonShape.Square}
        {...(isOrderStatusClearable(status)
          ? { onClick: () => dispatch(clearOrder(orderId)) }
          : {
              onClick: onCancel,
              state: {
                isLoading: isCanceling,
                isDisabled: isCancelDisabled,
              },
            })}
      />
    </ActionsTableCell>
  );
};
const $CancelButton = styled(IconButton)`
  --button-hover-textColor: var(--color-red);

  svg {
    width: 0.875em;
    height: 0.875em;
  }
`;
