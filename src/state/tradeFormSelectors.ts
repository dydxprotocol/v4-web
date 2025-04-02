import { TradeFormFns } from '@/bonsai/forms/trade/trade';
import { TradeFormInputData } from '@/bonsai/forms/trade/types';
import { BonsaiCore, BonsaiHelpers, BonsaiRaw } from '@/bonsai/ontology';

import { purgeBigNumbers } from '@/lib/purgeBigNumber';

import { RootState } from './_store';
import { createAppSelector } from './appTypes';
import { getCurrentMarketIdIfTradeable } from './currentMarketSelectors';

export const getTradeFormRawState = (state: RootState) => state.tradeForm;

// type shenanigans to force the groupingMultiplier to be optional
const selectRawOrderbook = BonsaiHelpers.currentMarket.orderbook.createSelectGroupedData() as (
  state: RootState
) => ReturnType<ReturnType<typeof BonsaiHelpers.currentMarket.orderbook.createSelectGroupedData>>;

const getTradeFormInputData = createAppSelector(
  [
    BonsaiCore.account.stats.data,
    BonsaiCore.rewardParams.data,
    BonsaiCore.configs.feeTiers,
    BonsaiRaw.parentSubaccountBase,
    BonsaiRaw.parentSubaccountRelevantMarkets,
    BonsaiCore.account.openOrders.data,
    BonsaiHelpers.currentMarket.account.openOrders,
    BonsaiHelpers.currentMarket.marketInfo,
    selectRawOrderbook,
    BonsaiRaw.currentMarket,
  ],
  (
    userFeeStats,
    rewardParams,
    feeTiers,
    rawParentSubaccountData,
    rawRelevantMarkets,
    allOpenOrders,
    currentTradeMarketOpenOrders,
    currentTradeMarketSummary,
    currentTradeMarketOrderbook,
    currentTradeMarket
  ): TradeFormInputData => ({
    rawParentSubaccountData,
    rawRelevantMarkets,

    currentTradeMarketOpenOrders,
    allOpenOrders,

    currentTradeMarket,
    currentTradeMarketSummary,
    currentTradeMarketOrderbook,

    userFeeStats,
    feeTiers,
    rewardParams,
  })
);

export const getTradeFormSummary = createAppSelector(
  [getCurrentMarketIdIfTradeable, getTradeFormInputData, getTradeFormRawState],
  (marketId, inputData, state) => {
    const summary = TradeFormFns.calculateSummary(state, inputData);
    console.log(purgeBigNumbers(summary), purgeBigNumbers(inputData));
    return {
      summary,
      errors: TradeFormFns.getErrors(state, inputData, summary),
    };
  }
);

export const getTradeFormValues = createAppSelector(
  [getTradeFormSummary],
  (s) => s.summary.effectiveTrade
);
