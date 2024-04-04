import { useEffect, useState } from 'react';

import { shallowEqual, useSelector } from 'react-redux';

import { AbacusOrderType, SubaccountOrder, TriggerOrdersInputField } from '@/constants/abacus';

import { getTriggerOrdersInputErrors } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { isLimitOrderType } from '@/lib/orders';

export const useTriggerOrdersFormInputs = ({
  marketId,
  positionSize,
  stopLossOrder,
  takeProfitOrder,
}: {
  marketId: string;
  positionSize: number | null;
  stopLossOrder?: SubaccountOrder;
  takeProfitOrder?: SubaccountOrder;
}) => {
  const inputErrors = useSelector(getTriggerOrdersInputErrors, shallowEqual);

  const [differingOrderSizes, setDifferingOrderSizes] = useState(false);
  const [inputSize, setInputSize] = useState<number | null>(null);

  const setSize = (size: number | null) => {
    const absSize = size ? Math.abs(size) : null;
    abacusStateManager.setTriggerOrdersValue({
      field: TriggerOrdersInputField.size,
      value: absSize != null ? MustBigNumber(absSize).toString() : null,
    });
    setInputSize(absSize);
  };

  useEffect(() => {
    // Initialize trigger order data on mount
    if (stopLossOrder) {
      [
        {
          field: TriggerOrdersInputField.stopLossOrderId,
          value: stopLossOrder.id,
        },
        {
          field: TriggerOrdersInputField.stopLossOrderSize,
          value: stopLossOrder.size,
        },
        {
          field: TriggerOrdersInputField.stopLossPrice,
          value: MustBigNumber(stopLossOrder.triggerPrice).toString(),
        },
        isLimitOrderType(stopLossOrder.type) && {
          field: TriggerOrdersInputField.stopLossLimitPrice,
          value: MustBigNumber(stopLossOrder.price).toString(),
        },
        {
          field: TriggerOrdersInputField.stopLossOrderType,
          value: stopLossOrder.type.rawValue,
        },
      ]
        .filter(isTruthy)
        .map(({ field, value }) => abacusStateManager.setTriggerOrdersValue({ field, value }));
    } else {
      abacusStateManager.setTriggerOrdersValue({
        field: TriggerOrdersInputField.stopLossOrderType,
        value: AbacusOrderType.stopMarket.rawValue,
      });
    }

    if (takeProfitOrder) {
      [
        {
          field: TriggerOrdersInputField.takeProfitOrderId,
          value: takeProfitOrder.id,
        },
        {
          field: TriggerOrdersInputField.takeProfitOrderSize,
          value: takeProfitOrder.size,
        },
        {
          field: TriggerOrdersInputField.takeProfitPrice,
          value: MustBigNumber(takeProfitOrder.triggerPrice).toString(),
        },
        isLimitOrderType(takeProfitOrder.type) && {
          field: TriggerOrdersInputField.takeProfitLimitPrice,
          value: MustBigNumber(takeProfitOrder.price).toString(),
        },
        {
          field: TriggerOrdersInputField.takeProfitOrderType,
          value: takeProfitOrder.type.rawValue,
        },
      ]
        .filter(isTruthy)
        .map(({ field, value }) => abacusStateManager.setTriggerOrdersValue({ field, value }));
    } else {
      abacusStateManager.setTriggerOrdersValue({
        field: TriggerOrdersInputField.takeProfitOrderType,
        value: AbacusOrderType.takeProfitMarket.rawValue,
      });
    }

    if (stopLossOrder?.size && takeProfitOrder?.size) {
      if (stopLossOrder?.size === takeProfitOrder?.size) {
        setSize(stopLossOrder?.size);
      } else {
        setSize(null);
        setDifferingOrderSizes(true);
      }
    } else if (stopLossOrder?.size) {
      setSize(stopLossOrder?.size);
    } else if (takeProfitOrder?.size) {
      setSize(takeProfitOrder?.size);
    } else {
      // Default to full position size for initial order creation
      setSize(positionSize);
    }
  }, []);

  useEffect(() => {
    abacusStateManager.setTriggerOrdersValue({
      field: TriggerOrdersInputField.marketId,
      value: marketId,
    });
  }, [marketId]);

  return {
    inputErrors,
    // True when user is editing an existing order; false when creating completely new orders
    isEditingExistingOrder: stopLossOrder || takeProfitOrder,
    // True if an SL + TP order exist, and if they are set on different order sizes
    differingOrderSizes,
    // Default input size to be shown on custom amount slider, null if different order sizes
    inputSize,
    // Boolean to signify whether the limit box should be checked on initial render of the triggers order form
    existsLimitOrder:
      (stopLossOrder && isLimitOrderType(stopLossOrder.type)) ||
      (takeProfitOrder && isLimitOrderType(takeProfitOrder.type)),
  };
};
