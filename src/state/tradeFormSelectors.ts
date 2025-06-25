import { getErrorTradeSummary } from '@/bonsai/forms/trade/summary';
import {
  OrderSide,
  TimeInForce,
  TradeFormInputData,
  TradeFormType,
} from '@/bonsai/forms/trade/types';
import { createMinimalError } from '@/bonsai/lib/validationErrors';
import { BonsaiCore, BonsaiForms, BonsaiHelpers, BonsaiRaw } from '@/bonsai/ontology';
import { minBy } from 'lodash';

import { DialogTypes, TradeBoxDialogTypes } from '@/constants/dialogs';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { assertNever } from '@/lib/assertNever';
import { isPresent } from '@/lib/typeUtils';

import { type RootState } from './_store';
import { createAppSelector } from './appTypes';
import { getCurrentMarketIdIfTradeable } from './currentMarketSelectors';
import { getActiveDialog, getActiveTradeBoxDialog } from './dialogsSelectors';

export const getTradeFormRawState = (state: RootState) => state.tradeForm;

// type shenanigans to force the groupingMultiplier to be optional
const selectRawOrderbook = BonsaiHelpers.currentMarket.orderbook.selectGroupedData as (
  state: RootState
) => ReturnType<typeof BonsaiHelpers.currentMarket.orderbook.selectGroupedData>;

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
    BonsaiCore.configs.equityTiers,
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
    currentTradeMarket,
    equityTiers
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
    equityTiers,
  })
);

export const getTradeFormSummary = createAppSelector(
  [getCurrentMarketIdIfTradeable, getTradeFormInputData, getTradeFormRawState],
  (marketId, inputData, state) => {
    if (marketId == null || marketId !== state.marketId) {
      return { summary: getErrorTradeSummary(state.marketId), errors: [createMinimalError()] };
    }
    const summary = BonsaiForms.TradeFormFns.calculateSummary(state, inputData);
    const errors = BonsaiForms.TradeFormFns.getErrors(state, inputData, summary);

    return {
      inputData,
      summary,
      errors,
    };
  }
);

export const getTradeFormValues = createAppSelector(
  [getTradeFormSummary],
  (s) => s.summary.effectiveTrade
);

export const getClosePositionFormRawState = (state: RootState) => state.closePositionForm;

export const getClosePositionFormSummary = createAppSelector(
  [getCurrentMarketIdIfTradeable, getTradeFormInputData, getClosePositionFormRawState],
  (currentMarketId, inputData, state) => {
    const { size, marketId, type, limitPrice } = state;

    if (
      currentMarketId == null ||
      currentMarketId !== marketId ||
      // we only allow limit and market close
      (type !== TradeFormType.LIMIT && type !== TradeFormType.MARKET)
    ) {
      return { summary: getErrorTradeSummary(state.marketId), errors: [createMinimalError()] };
    }

    const currentPosition = minBy(
      Object.values(inputData.rawParentSubaccountData?.childSubaccounts ?? {})
        .map((a) => a?.openPerpetualPositions[currentMarketId])
        .filter(isPresent),
      (a) => a.subaccountNumber
    );

    if (currentPosition == null) {
      return { summary: getErrorTradeSummary(state.marketId), errors: [createMinimalError()] };
    }

    const summary = BonsaiForms.TradeFormFns.calculateSummary(
      {
        type,
        size,
        marketId,
        reduceOnly: true,
        side: currentPosition.side === IndexerPositionSide.LONG ? OrderSide.SELL : OrderSide.BUY,
        limitPrice,
        timeInForce: TimeInForce.IOC,

        // let these default
        marginMode: undefined,
        targetLeverage: undefined,
        postOnly: undefined,
        triggerPrice: undefined,
        execution: undefined,
        goodTil: undefined,
        stopLossOrder: undefined,
        takeProfitOrder: undefined,
      },
      inputData
    );

    return {
      inputData,
      summary,
      errors: BonsaiForms.TradeFormFns.getErrors(state, inputData, summary),
    };
  }
);

export const getClosePositionFormValues = createAppSelector(
  [getClosePositionFormSummary],
  (s) => s.summary.effectiveTrade
);

export const getCurrentTradePageForm = createAppSelector(
  [getActiveDialog, getActiveTradeBoxDialog],
  (dialog, tradeDialog) => {
    if (dialog != null && DialogTypes.is.ClosePosition(dialog)) {
      return 'CLOSE_POSITION';
    }
    if (tradeDialog != null && TradeBoxDialogTypes.is.ClosePosition(tradeDialog)) {
      return 'CLOSE_POSITION';
    }
    return 'TRADE';
  }
);

export const getCurrentSelectedFormSummary = createAppSelector(
  [getCurrentTradePageForm, getClosePositionFormSummary, getTradeFormSummary],
  (selected, close, trade) => {
    if (selected === 'TRADE') {
      return trade;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (selected === 'CLOSE_POSITION') {
      return close;
    }
    assertNever(selected);
    return trade;
  }
);

export const getCurrentSelectedFormPositionSummary = createAppSelector(
  [getCurrentSelectedFormSummary],
  (summary) => {
    return summary.summary.accountDetailsAfter?.position;
  }
);
