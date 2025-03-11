import { mapValues } from 'lodash';

import {
  ClosePositionSizeInputs,
  ExecutionType,
  FieldState,
  GoodUntilTime,
  MarginMode,
  matchOrderType,
  OrderSide,
  OrderSizeInputs,
  TimeInForce,
  TimeUnit,
  TradeForm,
  TradeFormFieldStates,
  TradeFormType,
} from './types';

const DEFAULT_GOOD_TIL_TIME: GoodUntilTime = {
  duration: '28',
  unit: TimeUnit.DAY,
};

function getOrderFormFieldStates(form: TradeForm): TradeFormFieldStates {
  const { type } = form;

  // External data dependencies - these would come from your app state
  const hasExistingPosition: boolean = false; // Should be determined from your position data
  const existingPositionMarginMode: MarginMode | undefined = undefined; // Should come from position data
  const maxMarketLeverage: number = 100; // Should come from market data

  // Default values for each field type to use when renderedValue is needed
  const defaults: Required<TradeForm> = {
    type: TradeFormType.LIMIT, // Default is LIMIT according to kotlin code
    marketId: '', // No default, let it be empty and generate an error when missing
    side: OrderSide.BUY,
    size: OrderSizeInputs.SIZE({ value: '' }),
    reduceOnly: false,
    marginMode: MarginMode.CROSS,
    targetLeverage: '10', // DEFAULT_TARGET_LEVERAGE is 10, capped by maxMarketLeverage
    limitPrice: '', // Allow it to be empty until user inputs something
    postOnly: false,
    timeInForce: TimeInForce.GTT,
    triggerPrice: '',
    execution: ExecutionType.DEFAULT,
    goodTil: DEFAULT_GOOD_TIL_TIME,
    positionId: '',
    closeSize: ClosePositionSizeInputs.POSITION_PERCENT({ value: '100' }),
  };

  // Initialize all fields as not visible
  const baseResult: TradeFormFieldStates = mapValues(defaults, (_default, key) => ({
    visible: false as const,
    rawValue: form[key as keyof TradeForm],
  })) as TradeFormFieldStates;

  // Helper function to create a visible field state with object param
  function visible<T>({
    rawValue,
    defaultValue,
    required = true,
    disabled = false,
  }: {
    rawValue?: T;
    defaultValue: NonNullable<T>;
    required?: boolean;
    disabled?: boolean;
  }): FieldState<T> {
    return {
      visible: true,
      rawValue,
      renderedValue: rawValue ?? defaultValue,
      required,
      disabled,
    };
  }

  // Helper to set margin mode field with correct handling for existing positions
  function setMarginMode(result: TradeFormFieldStates): void {
    if (hasExistingPosition) {
      // Force the margin mode to match existing position and disable it
      result.marginMode = visible({
        rawValue: existingPositionMarginMode,
        defaultValue: existingPositionMarginMode ?? defaults.marginMode,
        disabled: true,
      });
    } else {
      result.marginMode = visible({
        rawValue: form.marginMode,
        defaultValue: defaults.marginMode,
      });
    }
  }

  // Helper to handle size input based on margin mode
  function handleSizeInput(result: TradeFormFieldStates): void {
    // LEVERAGE input should only be visible for CROSS margin
    if (form.size?.type === 'LEVERAGE' && result.marginMode.renderedValue !== MarginMode.CROSS) {
      // Reset to SIZE input if leverage is selected but margin mode isn't CROSS
      result.size = visible({
        rawValue: OrderSizeInputs.SIZE({ value: '' }),
        defaultValue: defaults.size,
      });
    }
  }

  // Helper to set target leverage if needed
  function setTargetLeverage(result: TradeFormFieldStates): void {
    if (result.marginMode.renderedValue === MarginMode.ISOLATED) {
      result.targetLeverage = visible({
        rawValue: form.targetLeverage,
        defaultValue: defaults.targetLeverage,
      });
    }
  }

  // Make the type field always visible, required, and enabled
  baseResult.type = {
    visible: true,
    rawValue: type,
    renderedValue: type, // Default to LIMIT if not specified
    required: true,
    disabled: false,
  };

  // Use matchOrderType to apply specific rules for each order type
  return matchOrderType(type, {
    [TradeFormType.MARKET]: () => {
      const result = { ...baseResult };

      // Common fields for market orders
      result.marketId = visible({
        rawValue: form.marketId,
        defaultValue: defaults.marketId,
      });

      result.side = visible({
        rawValue: form.side,
        defaultValue: defaults.side,
      });

      result.size = visible({
        rawValue: form.size,
        defaultValue: defaults.size,
      });

      result.reduceOnly = visible({
        rawValue: form.reduceOnly,
        defaultValue: defaults.reduceOnly,
        required: false,
      });

      // Apply the margin mode logic
      setMarginMode(result);
      handleSizeInput(result);
      setTargetLeverage(result);

      return result;
    },

    [TradeFormType.LIMIT]: () => {
      const result = { ...baseResult };

      // Common fields for limit orders
      result.marketId = visible({
        rawValue: form.marketId,
        defaultValue: defaults.marketId,
      });

      result.side = visible({
        rawValue: form.side,
        defaultValue: defaults.side,
      });

      result.size = visible({
        rawValue: form.size,
        defaultValue: defaults.size,
      });

      result.limitPrice = visible({
        rawValue: form.limitPrice,
        defaultValue: defaults.limitPrice,
      });

      result.timeInForce = visible({
        rawValue: form.timeInForce,
        defaultValue: defaults.timeInForce,
      });

      // Apply the margin mode logic
      setMarginMode(result);
      handleSizeInput(result);
      setTargetLeverage(result);

      // goodTil is only visible and required for GTT
      if (result.timeInForce.renderedValue === TimeInForce.GTT) {
        result.goodTil = visible({
          rawValue: form.goodTil,
          defaultValue: defaults.goodTil,
        });

        result.postOnly = visible({
          rawValue: form.postOnly,
          defaultValue: defaults.postOnly,
          required: false,
        });
      } else if (result.timeInForce.renderedValue === TimeInForce.IOC) {
        result.reduceOnly = visible({
          rawValue: form.reduceOnly,
          defaultValue: defaults.reduceOnly,
          required: false,
        });

        // If it's IOC, post only should be forced to false
        result.postOnly = visible({
          rawValue: false,
          defaultValue: false,
          required: false,
          disabled: true,
        });
      }

      return result;
    },

    [TradeFormType.STOP_MARKET]: () => {
      const result = { ...baseResult };

      // Common fields for stop market orders
      result.marketId = visible({
        rawValue: form.marketId,
        defaultValue: defaults.marketId,
      });

      result.side = visible({
        rawValue: form.side,
        defaultValue: defaults.side,
      });

      result.size = visible({
        rawValue: form.size,
        defaultValue: defaults.size,
      });

      result.triggerPrice = visible({
        rawValue: form.triggerPrice,
        defaultValue: defaults.triggerPrice,
      });

      result.goodTil = visible({
        rawValue: form.goodTil,
        defaultValue: defaults.goodTil,
      });

      result.reduceOnly = visible({
        rawValue: form.reduceOnly,
        defaultValue: defaults.reduceOnly,
        required: false,
      });

      // Apply the margin mode logic
      setMarginMode(result);
      handleSizeInput(result);
      setTargetLeverage(result);

      // Execution is fixed for stop market
      result.execution = visible({
        rawValue: ExecutionType.IOC,
        defaultValue: ExecutionType.IOC,
        disabled: true,
      });

      return result;
    },

    [TradeFormType.STOP_LIMIT]: () => {
      const result = { ...baseResult };

      // Common fields for stop limit orders
      result.marketId = visible({
        rawValue: form.marketId,
        defaultValue: defaults.marketId,
      });

      result.side = visible({
        rawValue: form.side,
        defaultValue: defaults.side,
      });

      result.size = visible({
        rawValue: form.size,
        defaultValue: defaults.size,
      });

      result.limitPrice = visible({
        rawValue: form.limitPrice,
        defaultValue: defaults.limitPrice,
      });

      result.triggerPrice = visible({
        rawValue: form.triggerPrice,
        defaultValue: defaults.triggerPrice,
      });

      result.goodTil = visible({
        rawValue: form.goodTil,
        defaultValue: defaults.goodTil,
      });

      result.execution = visible({
        rawValue: form.execution,
        defaultValue: defaults.execution,
      });

      // Apply the margin mode logic
      setMarginMode(result);
      handleSizeInput(result);
      setTargetLeverage(result);

      // reduceOnly is only visible when execution is IOC
      if (result.execution.renderedValue === ExecutionType.IOC) {
        result.reduceOnly = visible({
          rawValue: form.reduceOnly,
          defaultValue: defaults.reduceOnly,
          required: false,
        });
      } else {
        // Force reduceOnly to false if execution isn't IOC
        result.reduceOnly = visible({
          rawValue: false,
          defaultValue: false,
          required: false,
          disabled: true,
        });
      }

      // If execution is POST_ONLY, ensure postOnly is true
      if (result.execution.renderedValue === ExecutionType.POST_ONLY) {
        result.postOnly = visible({
          rawValue: true,
          defaultValue: true,
          required: false,
          disabled: true,
        });
      }

      return result;
    },

    [TradeFormType.TAKE_PROFIT_MARKET]: () => {
      const result = { ...baseResult };

      // Common fields for take profit market orders
      result.marketId = visible({
        rawValue: form.marketId,
        defaultValue: defaults.marketId,
      });

      result.side = visible({
        rawValue: form.side,
        defaultValue: defaults.side,
      });

      result.size = visible({
        rawValue: form.size,
        defaultValue: defaults.size,
      });

      result.triggerPrice = visible({
        rawValue: form.triggerPrice,
        defaultValue: defaults.triggerPrice,
      });

      result.goodTil = visible({
        rawValue: form.goodTil,
        defaultValue: defaults.goodTil,
      });

      result.reduceOnly = visible({
        rawValue: form.reduceOnly,
        defaultValue: defaults.reduceOnly,
        required: false,
      });

      // Apply the margin mode logic
      setMarginMode(result);
      handleSizeInput(result);
      setTargetLeverage(result);

      // Execution is fixed for take profit market
      result.execution = visible({
        rawValue: ExecutionType.IOC,
        defaultValue: ExecutionType.IOC,
        disabled: true,
      });

      return result;
    },

    [TradeFormType.TAKE_PROFIT_LIMIT]: () => {
      const result = { ...baseResult };

      // Common fields for take profit limit orders
      result.marketId = visible({
        rawValue: form.marketId,
        defaultValue: defaults.marketId,
      });

      result.side = visible({
        rawValue: form.side,
        defaultValue: defaults.side,
      });

      result.size = visible({
        rawValue: form.size,
        defaultValue: defaults.size,
      });

      result.limitPrice = visible({
        rawValue: form.limitPrice,
        defaultValue: defaults.limitPrice,
      });

      result.triggerPrice = visible({
        rawValue: form.triggerPrice,
        defaultValue: defaults.triggerPrice,
      });

      result.goodTil = visible({
        rawValue: form.goodTil,
        defaultValue: defaults.goodTil,
      });

      result.execution = visible({
        rawValue: form.execution,
        defaultValue: defaults.execution,
      });

      // Apply the margin mode logic
      setMarginMode(result);
      handleSizeInput(result);
      setTargetLeverage(result);

      // reduceOnly is only visible when execution is IOC
      if (result.execution.renderedValue === ExecutionType.IOC) {
        result.reduceOnly = visible({
          rawValue: form.reduceOnly,
          defaultValue: defaults.reduceOnly,
          required: false,
        });
      } else {
        // Force reduceOnly to false if execution isn't IOC
        result.reduceOnly = visible({
          rawValue: false,
          defaultValue: false,
          required: false,
          disabled: true,
        });
      }

      // If execution is POST_ONLY, ensure postOnly is true
      if (result.execution.renderedValue === ExecutionType.POST_ONLY) {
        result.postOnly = visible({
          rawValue: true,
          defaultValue: true,
          required: false,
          disabled: true,
        });
      }

      return result;
    },

    [TradeFormType.CLOSE_POSITION]: () => {
      const result = { ...baseResult };

      // For close position, type should be disabled
      result.type = {
        visible: true,
        rawValue: type,
        renderedValue: type,
        required: true,
        disabled: true,
      };

      // Fields for close position
      result.positionId = visible({
        rawValue: form.positionId,
        defaultValue: defaults.positionId,
      });

      result.closeSize = visible({
        rawValue: form.closeSize,
        defaultValue: defaults.closeSize,
      });

      // Side is determined by the position direction, allow negative value for inputs
      // but we'll infer the actual side during rendering
      result.side = visible({
        rawValue: form.side,
        defaultValue: defaults.side,
        disabled: true,
      });

      // Always set reduceOnly to true for close position
      result.reduceOnly = visible({
        rawValue: true,
        defaultValue: true,
        disabled: true,
      });

      // Optional limit order fields for a close position
      const isLimitClose = form.limitPrice !== undefined && form.limitPrice !== '';
      result.limitPrice = visible({
        rawValue: form.limitPrice,
        defaultValue: defaults.limitPrice,
        required: isLimitClose,
      });

      if (isLimitClose) {
        result.timeInForce = visible({
          rawValue: form.timeInForce,
          defaultValue: defaults.timeInForce,
        });

        if (result.timeInForce.renderedValue === TimeInForce.GTT) {
          result.goodTil = visible({
            rawValue: form.goodTil,
            defaultValue: defaults.goodTil,
          });

          result.postOnly = visible({
            rawValue: form.postOnly,
            defaultValue: defaults.postOnly,
            required: false,
          });
        } else {
          // If time in force is IOC, show reduceOnly which should already be true
          result.reduceOnly = visible({
            rawValue: true,
            defaultValue: true,
            disabled: true,
          });
        }
      } else {
        // For market close, set time in force to IOC
        result.timeInForce = visible({
          rawValue: TimeInForce.IOC,
          defaultValue: TimeInForce.IOC,
          disabled: true,
        });
      }

      return result;
    },
  });
}
