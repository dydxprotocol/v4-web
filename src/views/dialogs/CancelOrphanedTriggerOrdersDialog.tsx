import { useCallback, useEffect, useMemo, useState } from 'react';

import { accountTransactionManager } from '@/bonsai/AccountTransactionSupervisor';
import { isOperationFailure, isOperationSuccess } from '@/bonsai/lib/operationResult';
import { zipObject } from 'lodash';

import { ButtonAction } from '@/constants/buttons';
import { CancelOrphanedTriggersDialogProps, DialogProps } from '@/constants/dialogs';
import { ErrorParams } from '@/constants/errors';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';

import { selectOrphanedTriggerOrders } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { operationFailureToErrorParams } from '@/lib/errorHelpers';

type OrderCancelStatus =
  | { type: 'pending' }
  | { type: 'success' }
  | { type: 'error'; errorParams?: ErrorParams };

export const CancelOrphanedTriggerOrdersDialog = ({
  setIsOpen,
}: DialogProps<CancelOrphanedTriggersDialogProps>) => {
  const stringGetter = useStringGetter();
  const ordersToCancel = useAppSelector(selectOrphanedTriggerOrders);
  const [cancellingStatus, setCancellingStatus] = useState<Record<string, OrderCancelStatus>>({});

  const isCancelling = useMemo(
    () => Object.values(cancellingStatus).some((s) => s.type === 'pending'),
    [cancellingStatus]
  );

  useEffect(() => {
    const allResults = Object.values(cancellingStatus);
    if (allResults.length === 0) {
      return;
    }

    if (allResults.every((r) => r.type === 'success' || r.type === 'error')) {
      setIsOpen(false);
    }
  }, [cancellingStatus, setIsOpen]);

  const onCancel = useCallback(() => {
    if (isCancelling || ordersToCancel == null) {
      return;
    }

    setCancellingStatus(
      zipObject(
        ordersToCancel.map((o) => o.id),
        ordersToCancel.map(() => ({ type: 'pending' }))
      )
    );

    ordersToCancel.forEach(async (o) => {
      const result = await accountTransactionManager.cancelOrder({ orderId: o.id });
      if (isOperationSuccess(result)) {
        setCancellingStatus((old) => ({ ...old, [o.id]: { type: 'success' } }));
      } else if (isOperationFailure(result)) {
        setCancellingStatus((old) => ({
          ...old,
          [o.id]: { type: 'error', errorParams: operationFailureToErrorParams(result) },
        }));
      }
    });
  }, [isCancelling, ordersToCancel]);

  const submitButtonWithReceipt = (
    <Button
      action={ButtonAction.Destroy}
      onClick={onCancel}
      state={{ isDisabled: isCancelling || ordersToCancel == null, isLoading: isCancelling }}
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

  const dialogBody =
    ordersToCancel == null || ordersToCancel.length === 0 ? (
      <p>No remaining trigger orders to cancel.</p>
    ) : (
      <p>
        {stringGetter({
          key: STRING_KEYS.CANCEL_OLD_TRIGGERS,
        })}
      </p>
    );

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({
        key: STRING_KEYS.CANCEL_OLD_TRIGGERS,
      })}
    >
      <div tw="mb-1">{dialogBody}</div>
      {submitButtonWithReceipt}
    </Dialog>
  );
};
