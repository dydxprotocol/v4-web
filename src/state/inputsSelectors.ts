import { TriggerOrdersFormFns } from '@/bonsai/forms/triggers/triggers';
import { TriggerOrderInputData } from '@/bonsai/forms/triggers/types';
import { BonsaiHelpers } from '@/bonsai/ontology';

import { AbacusInputTypes } from '@/constants/abacus';
import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { EMPTY_ARR } from '@/constants/objects';

import { type RootState } from './_store';
import {
  getSubaccountConditionalOrders,
  getSubaccountPositionByUniqueId,
} from './accountSelectors';
import { getSelectedNetwork } from './appSelectors';
import { createAppSelector } from './appTypes';

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
