import { useEffect } from 'react';

import { PositionUniqueId, SubaccountOrder } from '@/bonsai/types/summaryTypes';
import { shallowEqual, useDispatch } from 'react-redux';

import { useAppSelector } from '@/state/appTypes';
import { getTriggersFormSummary } from '@/state/inputsSelectors';
import { triggersFormActions } from '@/state/triggersForm';

import { isLimitOrderTypeNew } from '@/lib/orders';

export const useTriggerOrdersFormInputs = ({
  positionId,
  stopLossOrder,
  takeProfitOrder,
}: {
  positionId: PositionUniqueId;
  stopLossOrder?: SubaccountOrder;
  takeProfitOrder?: SubaccountOrder;
}) => {
  const dispatch = useDispatch();
  const { errors, summary } = useAppSelector(getTriggersFormSummary, shallowEqual);

  const stopLossOrderSize = stopLossOrder?.size.toNumber();
  const takeProfitOrderSize = takeProfitOrder?.size.toNumber();

  useEffect(() => {
    return () => {
      dispatch(triggersFormActions.reset());
    };
  });
  useEffect(() => {
    dispatch(triggersFormActions.initializeForm(positionId));
  }, [dispatch, positionId]);

  useEffect(() => {
    dispatch(triggersFormActions.setStopLossOrderId(stopLossOrder?.id));
  }, [dispatch, stopLossOrder?.id]);

  useEffect(() => {
    dispatch(triggersFormActions.setTakeProfitOrderId(takeProfitOrder?.id));
  }, [dispatch, takeProfitOrder?.id]);

  return {
    inputErrors: errors,
    summary,

    existingStopLossOrder: stopLossOrder,
    existingTakeProfitOrder: takeProfitOrder,

    // True if an SL + TP order exist, and if they are set on different order sizes
    differingOrderSizes:
      takeProfitOrderSize != null &&
      stopLossOrderSize != null &&
      takeProfitOrderSize !== stopLossOrderSize,

    // Boolean to signify whether the limit box should be checked on initial render of the triggers order form
    existsLimitOrder:
      !!(stopLossOrder && isLimitOrderTypeNew(stopLossOrder.type)) ||
      !!(takeProfitOrder && isLimitOrderTypeNew(takeProfitOrder.type)),
  };
};
