import { useCallback, useState } from 'react';

import { OrderStatus } from '@/bonsai/types/summaryTypes';
import { type Nullable } from '@dydxprotocol/v4-abacus';
import { OrderFlags } from '@dydxprotocol/v4-client-js';
import styled from 'styled-components';

import { ButtonShape, ButtonStyle } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table/ActionsTableCell';
import { WithTooltip } from '@/components/WithTooltip';

import { isNewOrderStatusClearable } from '@/lib/orders';

type ElementProps = {
  orderId: string;
  orderFlags: Nullable<number | string>;
  status: OrderStatus;
  isDisabled?: boolean;
};

export const OrderActionsCell = ({ orderId, orderFlags, status, isDisabled }: ElementProps) => {
  const stringGetter = useStringGetter();

  const [isCanceling, setIsCanceling] = useState(false);

  const { cancelOrder } = useSubaccount();

  const onCancel = useCallback(async () => {
    setIsCanceling(true);
    cancelOrder({ orderId, onError: () => setIsCanceling(false) });
  }, []);

  // CT831: if order is stateful and is initially best effort canceled, it's a stuck order that
  // traders should be able to submit another cancel
  const isShortTermOrder = orderFlags?.toString() === OrderFlags.SHORT_TERM.toString();
  const isBestEffortCanceled = status === OrderStatus.Canceling;
  const isCancelDisabled =
    isCanceling || !!isDisabled || (isShortTermOrder && isBestEffortCanceled);

  return (
    <ActionsTableCell>
      <WithTooltip
        side="left"
        sideOffset={0}
        tw="[--tooltip-backgroundColor:--color-layer-5]"
        tooltipString={
          isNewOrderStatusClearable(status)
            ? stringGetter({ key: STRING_KEYS.CLEAR })
            : stringGetter({ key: STRING_KEYS.CANCEL_ORDER })
        }
      >
        <$CancelButton
          key="cancelorder"
          iconName={IconName.Close}
          iconSize="0.875em"
          shape={ButtonShape.Square}
          buttonStyle={ButtonStyle.WithoutBackground}
          {...(isNewOrderStatusClearable(status)
            ? {}
            : {
                onClick: onCancel,
                state: {
                  isLoading: isCanceling,
                  isDisabled: isCancelDisabled,
                },
              })}
        />
      </WithTooltip>
    </ActionsTableCell>
  );
};
const $CancelButton = styled(IconButton)`
  --button-hover-textColor: var(--color-red);
  --button-textColor: var(--color-text-0);
  min-width: var(--button-width);
`;
