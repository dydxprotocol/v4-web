import { shallowEqual, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

import type { RootState } from './_store';

/**
 * @param state
 * @returns TradeInputs
 */
export const getInputTradeData = (state: RootState) => state.inputs.tradeInputs;

/**
 * @param state
 * @returns Size data in TradeInputs
 */
export const getInputTradeSizeData = (state: RootState) => state.inputs.tradeInputs?.size;

/**
 * @param state
 * @returns AbacusOrderSide in TradeInputs
 */
export const getTradeSide = (state: RootState) => state.inputs.tradeInputs?.side;

/**
 * @param state
 * @returns TradeInputs options (config for what TradeInputFields to render)
 */
export const getInputTradeOptions = (state: RootState) => state.inputs.tradeInputs?.options;

/**
 * @param state
 * @returns ValidationErrors of the current Input type (Trade or Transfer)
 */
export const getInputErrors = (state: RootState) => state.inputs.inputErrors;

/**
 * @param state
 * @returns trade or closePosition transfer, depending on which form was last edited.
 */
export const getCurrentInput = (state: RootState) => state.inputs.current;

/**
 * @param state
 * @returns input errors for Trade
 */
export const getTradeInputErrors = (state: RootState) => {
  const currentInput = state.inputs.current;
  return currentInput === 'trade' ? getInputErrors(state) : [];
};

/**
 * @param state
 * @returns input errors for Close position
 */
export const getClosePositionInputErrors = (state: RootState) => {
  const currentInput = state.inputs.current;
  return currentInput === 'closePosition' ? getInputErrors(state) : [];
};

/**
 * @param state
 * @returns ClosePositionInputs
 */
export const getInputClosePositionData = (state: RootState) => state.inputs.closePositionInputs;

/**
 * @param state
 * @returns input errors for Transfer
 */
export const getTransferInputErrors = (state: RootState) => {
  const currentInput = state.inputs.current;
  return currentInput === 'transfer' ? getInputErrors(state) : [];
};

/**
 * @param state
 * @returns TransferInputs
 */
export const getTransferInputs = (state: RootState) => state.inputs.transferInputs;

/**
 * @param state
 * @returns input errors for TriggerOrders
 */
export const getTriggerOrdersInputErrors = (state: RootState) => {
  const currentInput = state.inputs.current;
  return currentInput === 'triggerOrders' ? getInputErrors(state) : [];
};

/**
 * @param state
 * @returns TriggerOrdersInputs
 */
export const getTriggerOrdersInputs = (state: RootState) => state.inputs.triggerOrdersInputs;

/**
 * @returns Data needed for the TradeForm (price, size, summary, input render options, and errors/input validation)
 */
export const useTradeFormData = () => {
  return useSelector(
    createSelector(
      [getInputTradeData, getInputTradeOptions, getTradeInputErrors],
      (tradeData, tradeOptions, tradeErrors) => {
        const { price, size, summary } = tradeData || {};

        const {
          needsLimitPrice,
          needsTrailingPercent,
          needsTriggerPrice,
          executionOptions,
          needsGoodUntil,
          needsPostOnly,
          needsReduceOnly,
          postOnlyTooltip,
          reduceOnlyTooltip,
          timeInForceOptions,
        } = tradeOptions || {};

        return {
          price,
          size,
          summary,

          needsLimitPrice,
          needsTrailingPercent,
          needsTriggerPrice,
          executionOptions,
          needsGoodUntil,
          needsPostOnly,
          needsReduceOnly,
          postOnlyTooltip,
          reduceOnlyTooltip,
          timeInForceOptions,

          tradeErrors,
        };
      }
    ),
    shallowEqual
  );
};

/**
 * @returns Tradeform Input states for display. Abacus inputs should track these values.
 */
export const getTradeFormInputs = (state: RootState) => state.inputs.tradeFormInputs;
