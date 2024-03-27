import { useEffect, useState } from 'react';

import { shallowEqual, useSelector } from 'react-redux';

import { SubaccountOrder, TriggerOrdersInputField } from '@/constants/abacus';

import { getTriggerOrdersInputErrors } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';

export const useTriggerOrdersFormInputs = ({
  marketId,
  positionSize,
  stopLossOrder,
  takeProfitOrder,
}: {
  marketId: string;
  positionSize?: number;
  stopLossOrder?: SubaccountOrder;
  takeProfitOrder?: SubaccountOrder;
}) => {
  const inputErrors = useSelector(getTriggerOrdersInputErrors, shallowEqual);

  const [differingOrderSizes, setDifferingOrderSizes] = useState(false);

  useEffect(() => {
    abacusStateManager.setTriggerOrdersValue({
      field: TriggerOrdersInputField.marketId,
      value: marketId,
    });
  }, [marketId]);

  useEffect(() => {
    // Initialize trigger order data on mount
    if (stopLossOrder) {
      [
        {
          field: TriggerOrdersInputField.stopLossOrderId,
          value: stopLossOrder.id,
        },
        {
          field: TriggerOrdersInputField.stopLossPrice,
          value: stopLossOrder.triggerPrice,
        },
        {
          field: TriggerOrdersInputField.stopLossLimitPrice,
          value: stopLossOrder.price,
        },
        {
          field: TriggerOrdersInputField.stopLossOrderType,
          value: stopLossOrder.type.rawValue,
        },
      ].map(({ field, value }) => abacusStateManager.setTriggerOrdersValue({ field, value }));
    }

    if (takeProfitOrder) {
      [
        {
          field: TriggerOrdersInputField.takeProfitOrderId,
          value: takeProfitOrder.id,
        },
        {
          field: TriggerOrdersInputField.takeProfitPrice,
          value: takeProfitOrder.triggerPrice,
        },
        {
          field: TriggerOrdersInputField.takeProfitLimitPrice,
          value: takeProfitOrder.price,
        },
        {
          field: TriggerOrdersInputField.takeProfitOrderType,
          value: takeProfitOrder.type.rawValue,
        },
      ].map(({ field, value }) => abacusStateManager.setTriggerOrdersValue({ field, value }));
    }

    const setSize = (value?: number) =>
      abacusStateManager.setTriggerOrdersValue({
        field: TriggerOrdersInputField.size,
        value,
      });

    if (stopLossOrder?.size && takeProfitOrder?.size) {
      // Assumption that we hide the size slider when the orders differ in size
      if (stopLossOrder?.size === takeProfitOrder?.size) {
        setSize(stopLossOrder?.size);
      } else {
        setSize(undefined);
        setDifferingOrderSizes(true);
      }
    } else if (stopLossOrder?.size) {
      setSize(stopLossOrder?.size);
    } else if (takeProfitOrder?.size) {
      setSize(takeProfitOrder?.size);
    } else {
      // Default to full position size
      setSize(positionSize);
    }
  }, []);

  return {
    inputErrors,
    isEditingExistingOrder: stopLossOrder || takeProfitOrder,
    differingOrderSizes,
  };
};
