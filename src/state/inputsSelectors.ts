import { useMemo } from 'react';

import { shallowEqual } from 'react-redux';

import { AbacusInputTypes } from '@/constants/abacus';
import { EMPTY_ARR } from '@/constants/objects';

import { type RootState } from './_store';
import { createAppSelector, useAppSelector } from './appTypes';

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
 * @returns The selected MarginMode in TradeInputs. 'CROSS' or 'ISOLATED'
 */
export const getInputTradeMarginMode = (state: RootState) => state.inputs.tradeInputs?.marginMode;

/**
 * @returns The specified targetLeverage for the next placed order
 */
export const getInputTradeTargetLeverage = (state: RootState) =>
  state.inputs.tradeInputs?.targetLeverage;

/**
 * @param state
 * @returns ValidationErrors of the current Input type
 */
export const getInputErrors = (state: RootState) => state.inputs.inputErrors;

/**
 * @param state
 * @returns trade, closePosition, transfer, or triggerOrders depending on which form was last edited.
 */
export const getCurrentInput = (state: RootState) => state.inputs.current;

/**
 * @param state
 * @returns input errors for Trade
 */
export const getTradeInputErrors = (state: RootState) => {
  const currentInput = state.inputs.current;
  return currentInput === AbacusInputTypes.Trade ? getInputErrors(state) : EMPTY_ARR;
};

/**
 * @param state
 * @returns input errors for Close position
 */
export const getClosePositionInputErrors = (state: RootState) => {
  const currentInput = state.inputs.current;
  return currentInput === AbacusInputTypes.ClosePosition ? getInputErrors(state) : EMPTY_ARR;
};

/**
 * @param state
 * @returns ClosePositionInputs
 */
export const getInputClosePositionData = (state: RootState) => state.inputs.closePositionInputs;

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
  return currentInput === AbacusInputTypes.TriggerOrders ? getInputErrors(state) : EMPTY_ARR;
};

/**
 * @param state
 * @returns TriggerOrdersInputs
 */
export const getTriggerOrdersInputs = (state: RootState) => state.inputs.triggerOrdersInputs;

/**
 * @param state
 * @returns Trigger Form Input states for display. Abacus inputs should track these values.
 */
export const getTriggerFormInputs = (state: RootState) => state.inputs.triggerFormInputs;

/**
 * @returns AdjustIsolatedMarginInputs
 */
export const getAdjustIsolatedMarginInputs = (state: RootState) =>
  state.inputs.adjustIsolatedMarginInputs;

/**
 * @returns Data needed for the TradeForm (price, size, summary, input render options, and errors/input validation)
 */
export const useTradeFormData = () => {
  const selector = useMemo(
    () =>
      createAppSelector(
        [getInputTradeData, getInputTradeOptions, getTradeInputErrors],
        (tradeData, tradeOptions, tradeErrors) => {
          const { price, size, summary } = tradeData ?? {};

          const {
            needsLimitPrice,
            needsMarginMode,
            needsTargetLeverage,
            needsTrailingPercent,
            needsTriggerPrice,
            needsGoodUntil,
            needsPostOnly,
            needsReduceOnly,
            postOnlyTooltip,
            reduceOnlyTooltip,

            executionOptions,
            marginModeOptions,
            timeInForceOptions,
          } = tradeOptions ?? {};

          return {
            price,
            size,
            summary,

            needsLimitPrice,
            needsMarginMode,
            needsTargetLeverage,
            needsTrailingPercent,
            needsTriggerPrice,
            needsGoodUntil,
            needsPostOnly,
            needsReduceOnly,
            postOnlyTooltip,
            reduceOnlyTooltip,

            executionOptions,
            marginModeOptions,
            timeInForceOptions,

            tradeErrors,
          };
        }
      ),
    []
  );
  return useAppSelector(selector, shallowEqual);
};

/**
 * @returns Tradeform Input states for display. Abacus inputs should track these values.
 */
export const getTradeFormInputs = (state: RootState) => state.inputs.tradeFormInputs;

/**
 * @returns ClosePositionForm Input states for display
 */
export const getClosePositionFormInputs = (state: RootState) =>
  state.inputs.closePositionFormInputs;
