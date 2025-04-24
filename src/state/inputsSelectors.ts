import { TriggerOrdersFormFns } from '@/bonsai/forms/triggers/triggers';
import { TriggerOrderInputData } from '@/bonsai/forms/triggers/types';
import { BonsaiCore, BonsaiHelpers, BonsaiRaw } from '@/bonsai/ontology';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { type RootState } from './_store';
import {
  getSubaccountConditionalOrders,
  getSubaccountPositionByUniqueId,
} from './accountSelectors';
import { getSelectedNetwork } from './appSelectors';
import { createAppSelector } from './appTypes';

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
  [
    getSubaccountConditionalOrdersForTriggers,
    getTriggersFormMarket,
    getTriggersFormPosition,
    BonsaiCore.account.openOrders.data,
    BonsaiCore.configs.equityTiers,
    BonsaiRaw.parentSubaccountBase,
    BonsaiRaw.parentSubaccountRelevantMarkets,
  ],
  (
    existingTriggerOrders,
    market,
    position,
    allOpenOrders,
    equityTiers,
    rawParentSubaccountData,
    rawRelevantMarkets
  ): TriggerOrderInputData => ({
    existingTriggerOrders,
    market,
    position,
    equityTiers,
    allOpenOrders,
    rawParentSubaccountData,
    rawRelevantMarkets,
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
