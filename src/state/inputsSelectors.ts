import { useMemo } from 'react';

import { TriggerOrdersFormFns } from '@/bonsai/forms/triggers/triggers';
import { TriggerOrderInputData } from '@/bonsai/forms/triggers/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { shallowEqual } from 'react-redux';

import { AbacusInputTypes } from '@/constants/abacus';
import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { EMPTY_ARR } from '@/constants/objects';

import { type RootState } from './_store';
import {
  getSubaccountConditionalOrders,
  getSubaccountPositionByUniqueId,
} from './accountSelectors';
import { getSelectedNetwork } from './appSelectors';
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

export const getTriggersFormState = (state: RootState) => state.triggersForm;

const myPositionSelector = getSubaccountPositionByUniqueId();
export const getTriggersFormPosition = createAppSelector(
  [(s) => s, (s) => getTriggersFormState(s).positionId],
  (state, positionId) => (positionId != null ? myPositionSelector(state, positionId) : undefined)
);

const myMarketSelector = BonsaiHelpers.markets.createSelectMarketSummaryById();
const getTriggersFormMarket = createAppSelector(
  [(s) => s, getTriggersFormPosition],
  (state, position) => (position != null ? myMarketSelector(state, position.market) : undefined)
);

const myConditionalOrdersSelector = getSubaccountConditionalOrders();
const getSubaccountConditionalOrdersForTriggersBase = createAppSelector(
  [(s) => s, getSelectedNetwork],
  (state, selectedNetwork) => {
    const isSlTpLimitOrdersEnabled =
      ENVIRONMENT_CONFIG_MAP[selectedNetwork].featureFlags.isSlTpLimitOrdersEnabled;
    return myConditionalOrdersSelector(state, isSlTpLimitOrdersEnabled);
  }
);

const getSubaccountConditionalOrdersForTriggers = createAppSelector(
  [getSubaccountConditionalOrdersForTriggersBase, getTriggersFormState],
  (orders, { positionId }) =>
    positionId != null
      ? [
          ...(orders[positionId]?.stopLossOrders ?? []),
          ...(orders[positionId]?.takeProfitOrders ?? []),
        ]
      : undefined
);

const getTriggersFormInputData = createAppSelector(
  [getSubaccountConditionalOrdersForTriggers, getTriggersFormMarket, getTriggersFormPosition],
  (existingTriggerOrders, market, position): TriggerOrderInputData => ({
    existingTriggerOrders,
    market,
    position,
  })
);

export const getTriggersFormSummary = createAppSelector(
  [getTriggersFormInputData, getTriggersFormState],
  (inputData, state) => {
    const summary = TriggerOrdersFormFns.calculateSummary(state, inputData);
    return {
      summary,
      errors: TriggerOrdersFormFns.getErrors(state, inputData, summary),
    };
  }
);
