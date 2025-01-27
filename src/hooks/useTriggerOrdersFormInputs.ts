import { useEffect, useState } from 'react';

import { SubaccountOrder } from '@/abacus-ts/types/summaryTypes';
import { shallowEqual, useDispatch } from 'react-redux';

import { AbacusOrderType, TriggerOrdersInputField } from '@/constants/abacus';

import { useAppSelector } from '@/state/appTypes';
import { setTriggerFormInputs } from '@/state/inputs';
import { getTriggerOrdersInputErrors } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { isLimitOrderTypeNew } from '@/lib/orders';

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
  const dispatch = useDispatch();
  const inputErrors = useAppSelector(getTriggerOrdersInputErrors, shallowEqual);

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
          hasFormInput: false,
        },
        {
          field: TriggerOrdersInputField.stopLossOrderSize,
          value: stopLossOrder.size.toNumber(),
          hasFormInput: false,
        },
        {
          field: TriggerOrdersInputField.stopLossOrderType,
          // DANGER - only safe because they happen to match, manually verified
          value: stopLossOrder.type,
          hasFormInput: false,
        },
        {
          field: TriggerOrdersInputField.stopLossPrice,
          value: stopLossOrder.triggerPrice?.toNumber(),
          hasFormInput: true,
        },
        isLimitOrderTypeNew(stopLossOrder.type) && {
          field: TriggerOrdersInputField.stopLossLimitPrice,
          value: stopLossOrder.price.toNumber(),
          hasFormInput: true,
        },
      ]
        .filter(isTruthy)
        .forEach(({ field, value, hasFormInput }) => {
          abacusStateManager.setTriggerOrdersValue({ field, value });
          if (hasFormInput) {
            dispatch(
              setTriggerFormInputs({
                [field.rawValue]: value?.toString(),
              })
            );
          }
        });
    } else {
      abacusStateManager.setTriggerOrdersValue({
        field: TriggerOrdersInputField.stopLossOrderType,
        value: AbacusOrderType.StopMarket.rawValue,
      });
    }

    if (takeProfitOrder) {
      // Initialize trigger order data on mount
      [
        {
          field: TriggerOrdersInputField.takeProfitOrderId,
          value: takeProfitOrder.id,
          hasFormInput: false,
        },
        {
          field: TriggerOrdersInputField.takeProfitOrderSize,
          value: takeProfitOrder.size.toNumber(),
          hasFormInput: false,
        },
        {
          field: TriggerOrdersInputField.takeProfitOrderType,
          // DANGER - only safe because they happen to match, manually verified
          value: takeProfitOrder.type,
          hasFormInput: false,
        },
        {
          field: TriggerOrdersInputField.takeProfitPrice,
          value: takeProfitOrder.triggerPrice?.toNumber(),
          hasFormInput: true,
        },
        isLimitOrderTypeNew(takeProfitOrder.type) && {
          field: TriggerOrdersInputField.takeProfitLimitPrice,
          value: takeProfitOrder.price.toNumber(),
          hasFormInput: true,
        },
      ]
        .filter(isTruthy)
        .forEach(({ field, value, hasFormInput }) => {
          abacusStateManager.setTriggerOrdersValue({ field, value });
          if (hasFormInput) {
            dispatch(
              setTriggerFormInputs({
                [field.rawValue]: value?.toString(),
              })
            );
          }
        });
    } else {
      abacusStateManager.setTriggerOrdersValue({
        field: TriggerOrdersInputField.takeProfitOrderType,
        value: AbacusOrderType.TakeProfitMarket.rawValue,
      });
    }

    if (stopLossOrder?.size && takeProfitOrder?.size) {
      if (stopLossOrder.size === takeProfitOrder.size) {
        setSize(stopLossOrder.size.toNumber());
      } else {
        setSize(null);
        setDifferingOrderSizes(true);
      }
    } else if (stopLossOrder?.size) {
      setSize(stopLossOrder.size.toNumber());
    } else if (takeProfitOrder?.size) {
      setSize(takeProfitOrder.size.toNumber());
    } else {
      // Default to full position size for initial order creation
      setSize(positionSize);
    }

    return () => {
      abacusStateManager.resetInputState();
    };
  }, []);

  useEffect(() => {
    abacusStateManager.setTriggerOrdersValue({
      field: TriggerOrdersInputField.marketId,
      value: marketId,
    });
  }, [marketId]);

  return {
    inputErrors,
    existingStopLossOrder: stopLossOrder,
    existingTakeProfitOrder: takeProfitOrder,
    // True if an SL + TP order exist, and if they are set on different order sizes
    differingOrderSizes,
    // Default input size to be shown on custom amount slider, null if different order sizes
    inputSize,
    // Boolean to signify whether the limit box should be checked on initial render of the triggers order form
    existsLimitOrder:
      !!(stopLossOrder && isLimitOrderTypeNew(stopLossOrder.type)) ||
      !!(takeProfitOrder && isLimitOrderTypeNew(takeProfitOrder.type)),
  };
};
