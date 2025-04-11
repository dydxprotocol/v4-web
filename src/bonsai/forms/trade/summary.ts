import {
  applyOperationsToSubaccount,
  createBatchedOperations,
} from '@/bonsai/calculators/accountActions';
import { getPositionUniqueId } from '@/bonsai/calculators/helpers';
import {
  calculateParentSubaccountPositions,
  calculateParentSubaccountSummary,
  calculateSubaccountSummary,
} from '@/bonsai/calculators/subaccount';
import { ApplyTradeProps, SubaccountOperations } from '@/bonsai/types/operationTypes';
import { MarketsData, ParentSubaccountDataBase } from '@/bonsai/types/rawTypes';
import { PositionUniqueId } from '@/bonsai/types/summaryTypes';
import { mapValues, orderBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { IndexerPerpetualMarketType, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { calc, mapIfPresent } from '@/lib/do';
import { FALLBACK_MARKET_LEVERAGE } from '@/lib/marketsHelpers';
import { AttemptNumber, MustBigNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { getTradeFormFieldStates, isFieldStateEnabled } from './fields';
import { calculateTradeInfo } from './tradeInfo';
import {
  ExecutionType,
  MarginMode,
  matchOrderType,
  OrderSide,
  SelectionOption,
  TimeInForce,
  TimeUnit,
  TradeAccountDetails,
  TradeForm,
  TradeFormFieldStates,
  TradeFormInputData,
  TradeFormOptions,
  TradeFormSummary,
  TradeFormType,
  TradeSummary,
} from './types';

export function calculateTradeSummary(
  state: TradeForm,
  accountData: TradeFormInputData
): TradeFormSummary {
  const positionIdToUse = getPositionIdToUseForTrade(
    state.marketId,
    accountData.rawParentSubaccountData
  );

  const rawMarkets = memoizedMergeMarkets(
    accountData.rawRelevantMarkets,
    accountData.currentTradeMarket
  );

  const baseAccount = mapIfPresent(
    accountData.rawParentSubaccountData,
    rawMarkets,
    (rawParentSubaccountData, markets) =>
      getRelevantAccountDetails(rawParentSubaccountData, markets, positionIdToUse)
  );

  const existingPositionOrOpenOrderMarginMode = calc(() => {
    if (baseAccount?.position != null) {
      const mode = baseAccount.position.marginMode;
      return mode === 'CROSS' ? MarginMode.CROSS : MarginMode.ISOLATED;
    }
    if (accountData.currentTradeMarketOpenOrders.length > 0) {
      const mode = accountData.currentTradeMarketOpenOrders[0]!.marginMode;
      if (mode == null) {
        return mode;
      }
      return mode === 'CROSS' ? MarginMode.CROSS : MarginMode.ISOLATED;
    }
    return undefined;
  });

  const fieldStates = getTradeFormFieldStates(
    state,
    existingPositionOrOpenOrderMarginMode,
    baseAccount?.position?.leverage?.toNumber(),
    baseAccount?.position?.maxLeverage?.toNumber() ?? FALLBACK_MARKET_LEVERAGE,
    accountData.currentTradeMarketSummary?.marketType === IndexerPerpetualMarketType.ISOLATED
  );

  const options = calculateTradeFormOptions(state.type, fieldStates, baseAccount);

  const tradeInfo: TradeSummary = calculateTradeInfo(fieldStates, baseAccount, accountData);

  const baseAccountAfter = calc(() => {
    if (accountData.rawParentSubaccountData == null) {
      return undefined;
    }

    const operationInformation = calculateTradeOperationsForSimulation(
      tradeInfo,
      accountData.currentTradeMarketOpenOrders.length > 0,
      fieldStates,
      accountData.currentTradeMarket?.oraclePrice ?? undefined
    );

    if (operationInformation.subaccountNumber == null) {
      return undefined;
    }

    const operations = createBatchedOperations(
      ...[
        operationInformation.transferToIsolatedSubaccountAmount != null &&
        operationInformation.subaccountNumber !==
          accountData.rawParentSubaccountData.parentSubaccount
          ? SubaccountOperations.SubaccountTransfer({
              senderSubaccountNumber: accountData.rawParentSubaccountData.parentSubaccount,
              amount: operationInformation.transferToIsolatedSubaccountAmount,
              recipientSubaccountNumber: operationInformation.subaccountNumber,
            })
          : undefined,
        operationInformation.tradeToApply != null
          ? SubaccountOperations.ApplyTrade(operationInformation.tradeToApply)
          : undefined,
        operationInformation.reclaimFunds
          ? SubaccountOperations.SubaccountTransferFull({
              recipientSubaccountNumber: accountData.rawParentSubaccountData.parentSubaccount,
              senderSubaccountNumber: operationInformation.subaccountNumber,
            })
          : undefined,
      ].filter(isPresent)
    );

    return mapIfPresent(
      accountData.rawParentSubaccountData,
      rawMarkets,
      state.marketId,
      (rawParentSubaccountData, markets, stateMarketId) =>
        getRelevantAccountDetails(
          applyOperationsToSubaccount(rawParentSubaccountData, operations),
          markets,
          getPositionUniqueId(stateMarketId, tradeInfo.subaccountNumber)
        )
    );
  });

  const effectiveTrade = mapValues(fieldStates, (s) => s.effectiveValue) as TradeForm;

  return {
    effectiveTrade,
    options,

    tradeInfo,

    accountBefore: baseAccount?.account,
    positionBefore: baseAccount?.position,

    accountAfter: baseAccountAfter?.account,
    positionAfter: baseAccountAfter?.position,
  };
}

export function getErrorTradeSummary(marketId?: string | undefined): TradeFormSummary {
  return {
    effectiveTrade: {
      type: TradeFormType.LIMIT,
      marketId,
      side: undefined,
      size: undefined,
      reduceOnly: undefined,
      marginMode: undefined,
      targetLeverage: undefined,
      limitPrice: undefined,
      postOnly: undefined,
      timeInForce: undefined,
      triggerPrice: undefined,
      execution: undefined,
      goodTil: undefined,
    },
    options: {
      orderTypeOptions: [],
      executionOptions: [],
      timeInForceOptions: [],
      goodTilUnitOptions: [],
      needsLeverage: false,
      needsAmountClose: false,
      needsMarginMode: false,
      needsSize: false,
      needsLimitPrice: false,
      needsTargetLeverage: false,
      needsTriggerPrice: false,
      needsGoodUntil: false,
      needsReduceOnly: false,
      needsPostOnly: false,
      needsReduceOnlyTooltip: false,
      needsPostOnlyTooltip: false,
    },
    tradeInfo: {
      inputSummary: {
        size: undefined,
        averageFillPrice: undefined,
      },
      subaccountNumber: 0,
      transferToSubaccountAmount: 0,
      payloadPrice: undefined,
      minimumSignedLeverage: 0,
      maximumSignedLeverage: 0,
      slippage: undefined,
      fee: undefined,
      total: undefined,
      reward: undefined,
      filled: false,
      isPositionClosed: false,
      indexSlippage: undefined,
      feeRate: undefined,
    },
  };
}

const orderTypeOptions: SelectionOption<TradeFormType>[] = [
  { value: TradeFormType.LIMIT, stringKey: 'APP.TRADE.LIMIT_ORDER_SHORT' },
  { value: TradeFormType.MARKET, stringKey: 'APP.TRADE.MARKET_ORDER_SHORT' },
  { value: TradeFormType.STOP_LIMIT, stringKey: 'APP.TRADE.STOP_LIMIT' },
  { value: TradeFormType.STOP_MARKET, stringKey: 'APP.TRADE.STOP_MARKET' },
  { value: TradeFormType.TAKE_PROFIT_LIMIT, stringKey: 'APP.TRADE.TAKE_PROFIT' },
  { value: TradeFormType.TAKE_PROFIT_MARKET, stringKey: 'APP.TRADE.TAKE_PROFIT_MARKET' },
];

const goodTilUnitOptions: SelectionOption<TimeUnit>[] = [
  { value: TimeUnit.MINUTE, stringKey: 'APP.GENERAL.TIME_STRINGS.MINUTES_SHORT' },
  { value: TimeUnit.HOUR, stringKey: 'APP.GENERAL.TIME_STRINGS.HOURS' },
  { value: TimeUnit.DAY, stringKey: 'APP.GENERAL.TIME_STRINGS.DAYS' },
  { value: TimeUnit.WEEK, stringKey: 'APP.GENERAL.TIME_STRINGS.WEEKS' },
];

const timeInForceOptions: SelectionOption<TimeInForce>[] = [
  { value: TimeInForce.GTT, stringKey: 'APP.TRADE.GOOD_TIL_TIME' },
  { value: TimeInForce.IOC, stringKey: 'APP.TRADE.IMMEDIATE_OR_CANCEL' },
];

// Define execution option arrays
const allExecutionOptions: SelectionOption<ExecutionType>[] = [
  { value: ExecutionType.GOOD_TIL_DATE, stringKey: 'APP.TRADE.GOOD_TIL_DATE' },
  { value: ExecutionType.IOC, stringKey: 'APP.TRADE.IMMEDIATE_OR_CANCEL' },
  { value: ExecutionType.POST_ONLY, stringKey: 'APP.TRADE.POST_ONLY' },
];

const iocOnlyExecutionOptions: SelectionOption<ExecutionType>[] = [
  { value: ExecutionType.IOC, stringKey: 'APP.TRADE.IMMEDIATE_OR_CANCEL' },
];

const emptyExecutionOptions: SelectionOption<ExecutionType>[] = [];

const memoizedMergeMarkets = weakMapMemoize(
  (
    rawRelevantMarkets: TradeFormInputData['rawRelevantMarkets'],
    currentTradeMarket: TradeFormInputData['currentTradeMarket']
  ) => {
    if (rawRelevantMarkets == null) {
      return undefined;
    }
    return {
      ...rawRelevantMarkets,
      ...(currentTradeMarket != null ? { [currentTradeMarket.ticker]: currentTradeMarket } : {}),
    };
  }
);

function calculateTradeFormOptions(
  orderType: TradeFormType | undefined,
  fields: TradeFormFieldStates,
  baseAccount: TradeAccountDetails | undefined
): TradeFormOptions {
  const executionOptions: SelectionOption<ExecutionType>[] = orderType
    ? matchOrderType(orderType, {
        [TradeFormType.LIMIT]: () => allExecutionOptions,
        [TradeFormType.STOP_LIMIT]: () => allExecutionOptions,
        [TradeFormType.TAKE_PROFIT_LIMIT]: () => allExecutionOptions,

        [TradeFormType.MARKET]: () => iocOnlyExecutionOptions,
        [TradeFormType.STOP_MARKET]: () => iocOnlyExecutionOptions,
        [TradeFormType.TAKE_PROFIT_MARKET]: () => iocOnlyExecutionOptions,
      })
    : emptyExecutionOptions;

  const isCross =
    fields.marginMode.effectiveValue == null ||
    fields.marginMode.effectiveValue === MarginMode.CROSS;

  const tradeSide = fields.side.effectiveValue;
  const reduceOnly = fields.reduceOnly.effectiveValue;
  const isDecreasing =
    (baseAccount?.position?.side === IndexerPositionSide.LONG && tradeSide === OrderSide.SELL) ||
    (baseAccount?.position?.side === IndexerPositionSide.SHORT && tradeSide === OrderSide.BUY);

  return {
    orderTypeOptions,
    executionOptions,
    timeInForceOptions,
    goodTilUnitOptions,

    needsLeverage: orderType === TradeFormType.MARKET && isCross && (!reduceOnly || !isDecreasing),
    needsAmountClose: orderType === TradeFormType.MARKET && !!reduceOnly && isDecreasing,
    needsTargetLeverage:
      isFieldStateEnabled(fields.targetLeverage) &&
      (orderType !== TradeFormType.MARKET || !reduceOnly),

    needsMarginMode: isFieldStateEnabled(fields.marginMode),
    needsSize: isFieldStateEnabled(fields.size),
    needsLimitPrice: isFieldStateEnabled(fields.limitPrice),
    needsTriggerPrice: isFieldStateEnabled(fields.triggerPrice),
    needsGoodUntil: isFieldStateEnabled(fields.goodTil),
    needsReduceOnly: isFieldStateEnabled(fields.reduceOnly),
    needsPostOnly: isFieldStateEnabled(fields.postOnly),
    needsPostOnlyTooltip: fields.postOnly.state === 'visible-disabled',
    needsReduceOnlyTooltip: fields.reduceOnly.state === 'visible-disabled',
  };
}

function getRelevantAccountDetails(
  rawParentSubaccountData: ParentSubaccountDataBase,
  rawRelevantMarkets: MarketsData,
  positionUniqueId?: PositionUniqueId
): TradeAccountDetails {
  const account = calculateParentSubaccountSummary(rawParentSubaccountData, rawRelevantMarkets);
  const positions = calculateParentSubaccountPositions(rawParentSubaccountData, rawRelevantMarkets);
  const position = positions.find(
    (p) => positionUniqueId != null && p.uniqueId === positionUniqueId
  );
  const subaccountSummaries = mapValues(rawParentSubaccountData.childSubaccounts, (subaccount) =>
    subaccount != null ? calculateSubaccountSummary(subaccount, rawRelevantMarkets) : subaccount
  );
  return { position, account, subaccountSummaries };
}

function getPositionIdToUseForTrade(
  marketId: string | undefined,
  rawParentSubaccountData: ParentSubaccountDataBase | undefined
): PositionUniqueId | undefined {
  if (marketId == null || marketId.trim().length === 0) {
    return undefined;
  }

  const allPositions = Object.values(rawParentSubaccountData?.childSubaccounts ?? {}).flatMap(
    (o) => (o != null ? o.openPerpetualPositions[marketId] ?? [] : [])
  );
  const positionToUse = orderBy(allPositions, [(p) => p.subaccountNumber], ['asc'])[0];
  return positionToUse != null
    ? getPositionUniqueId(positionToUse.market, positionToUse.subaccountNumber)
    : undefined;
}

interface TradeInfoForSimulation {
  subaccountNumber?: number;
  transferToIsolatedSubaccountAmount?: string;
  tradeToApply?: ApplyTradeProps;
  reclaimFunds?: boolean;
}

function calculateTradeOperationsForSimulation(
  tradeInfo: TradeSummary,
  hasOpenOrdersInMarket: boolean,
  fields: TradeFormFieldStates,
  marketOraclePrice: string | undefined
): TradeInfoForSimulation {
  const marketIdRaw = fields.marketId.effectiveValue;
  const sideRaw = fields.side.effectiveValue;
  const sizeRaw = tradeInfo.inputSummary.size;
  const averagePriceRaw = tradeInfo.inputSummary.averageFillPrice;
  const feeRaw = tradeInfo.fee ?? 0;
  const reduceOnlyRaw = fields.reduceOnly.effectiveValue ?? false;

  return {
    subaccountNumber: tradeInfo.subaccountNumber,
    transferToIsolatedSubaccountAmount: MustBigNumber(
      tradeInfo.transferToSubaccountAmount
    ).toString(10),
    reclaimFunds:
      tradeInfo.isPositionClosed &&
      fields.marginMode.effectiveValue === MarginMode.ISOLATED &&
      !hasOpenOrdersInMarket,
    tradeToApply: mapIfPresent(
      marketIdRaw,
      sideRaw,
      sizeRaw?.size,
      averagePriceRaw,
      feeRaw,
      reduceOnlyRaw,
      (marketId, side, size, averagePrice, fee, reduceOnly) => ({
        subaccountNumber: tradeInfo.subaccountNumber,
        marketId,
        side,
        size,
        averagePrice,
        fee,
        reduceOnly,
        marketOraclePrice: AttemptNumber(marketOraclePrice) ?? averagePrice,
      })
    ),
  };
}
