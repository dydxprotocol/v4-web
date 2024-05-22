import { useCallback, useState } from 'react';

import { type Nullable } from '@dydxprotocol/v4-abacus';
import { OrderFlags } from '@dydxprotocol/v4-client-js';
import styled from 'styled-components';

import { AbacusOrderStatus, type OrderStatus } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';

import { useSubaccount } from '@/hooks/useSubaccount';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table/ActionsTableCell';

import { clearOrder } from '@/state/account';
import { useAppDispatch } from '@/state/appTypes';

import { isOrderStatusClearable } from '@/lib/orders';

type ElementProps = {
  orderId: string;
  orderFlags: Nullable<number>;
  status: OrderStatus;
  isDisabled?: boolean;
};

export const OrderActionsCell = ({ orderId, orderFlags, status, isDisabled }: ElementProps) => {
  const dispatch = useAppDispatch();

  const [isCanceling, setIsCanceling] = useState(false);

  const { cancelOrder } = useSubaccount();

  const onCancel = useCallback(async () => {
    setIsCanceling(true);
    cancelOrder({ orderId, onError: () => setIsCanceling(false) });
  }, []);

  // CT831: if order is stateful and is initially best effort canceled, it's a stuck order that
  // traders should be able to submit another cancel
  const isShortTermOrder = orderFlags === OrderFlags.SHORT_TERM;
  const isBestEffortCanceled = status === AbacusOrderStatus.canceling;
  const isCancelDisabled =
    isCanceling || !!isDisabled || (isShortTermOrder && isBestEffortCanceled);

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
