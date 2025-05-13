import { TriggerOrderInputData } from '@/bonsai/forms/triggers/types';
import { BonsaiCore, BonsaiForms, BonsaiHelpers, BonsaiRaw } from '@/bonsai/ontology';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { type RootState } from './_store';
import {
  getSubaccountConditionalOrders,
  getSubaccountPositionByUniqueId,
} from './accountSelectors';
import { getSelectedNetwork } from './appSelectors';
import { createAppSelector } from './appTypes';

export const getTriggersFormState = (state: RootState) => state.triggersForm;

export const getTriggersFormPosition = createAppSelector(
  [(s) => s, (s) => getTriggersFormState(s).positionId],
  (state, positionId) =>
    positionId != null ? getSubaccountPositionByUniqueId(state, positionId) : undefined
);

const getTriggersFormMarket = createAppSelector(
  [(s) => s, getTriggersFormPosition],
  (state, position) =>
    position != null
      ? BonsaiHelpers.markets.selectMarketSummaryById(state, position.market)
      : undefined
);

const getSubaccountConditionalOrdersForTriggersBase = createAppSelector(
  [(s) => s, getSelectedNetwork],
  (state, selectedNetwork) => {
    const isSlTpLimitOrdersEnabled =
      ENVIRONMENT_CONFIG_MAP[selectedNetwork].featureFlags.isSlTpLimitOrdersEnabled;
    return getSubaccountConditionalOrders(state, isSlTpLimitOrdersEnabled);
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
    const summary = BonsaiForms.TriggerOrdersFormFns.calculateSummary(state, inputData);
    return {
      summary,
      errors: BonsaiForms.TriggerOrdersFormFns.getErrors(state, inputData, summary),
    };
  }
);
