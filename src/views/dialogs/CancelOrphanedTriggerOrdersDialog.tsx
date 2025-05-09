import { useCallback, useMemo, useState } from 'react';

import { accountTransactionManager } from '@/bonsai/AccountTransactionSupervisor';
import { SubaccountOrder } from '@/bonsai/types/summaryTypes';
import { Description } from '@radix-ui/react-dialog';
import { groupBy } from 'lodash';

import { ButtonAction } from '@/constants/buttons';
import { CancelOrphanedTriggersDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';

import { selectOrphanedTriggerOrders } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

export const CancelOrphanedTriggerOrdersDialog = ({
  setIsOpen,
}: DialogProps<CancelOrphanedTriggersDialogProps>) => {
  const stringGetter = useStringGetter();
  const ordersToCancel = useAppSelector(selectOrphanedTriggerOrders);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const markets: Record<string, SubaccountOrder[]> = useMemo(() => {
    return groupBy(ordersToCancel, (o) => o.marketId);
  }, [ordersToCancel]);

  const onCancelAll = useCallback(() => {
    if (ordersToCancel == null || ordersToCancel.length === 0) {
      return;
    }

    setIsLoading(true);

    ordersToCancel.forEach(({ id }) => {
      accountTransactionManager.cancelOrder({ orderId: id });
    });

    setIsLoading(false);
    setIsOpen(false);
  }, [ordersToCancel, setIsOpen]);

  const submitButton = (
    <Button
      action={ButtonAction.Destroy}
      onClick={onCancelAll}
      state={{
        isDisabled: ordersToCancel == null || ordersToCancel.length === 0,
        isLoading,
      }}
      tw="w-full"
    >
      {ordersToCancel?.length !== 1
        ? stringGetter({
            key: STRING_KEYS.CANCEL_ORDERS_COUNT,
            params: { COUNT: ordersToCancel?.length },
          })
        : stringGetter({
            key: STRING_KEYS.CANCEL_ORDER,
          })}
    </Button>
  );

  const description =
    ordersToCancel == null || ordersToCancel.length === 0
      ? stringGetter({ key: STRING_KEYS.NO_CANCELABLE_ORDERS })
      : stringGetter({
          key: STRING_KEYS.YOUR_OPEN_TRIGGER_ORDERS_NO_POSITION,
          params: {
            NUM_ORDERS: ordersToCancel.length,
            NUM_MARKETS: Object.keys(markets).length,
          },
        });

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({
        key: STRING_KEYS.CANCEL_OLD_TRIGGERS,
      })}
      hasHeaderBorder
    >
      <div tw="flexColumn mt-1.25 gap-1.25">
        <Description tw="text-color-text-0 font-base-book">{description}</Description>
        {submitButton}
      </div>
    </Dialog>
  );
};
