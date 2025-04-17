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
import { OrderExecution, OrderTimeInForce, OrderType } from '@dydxprotocol/v4-client-js';
import { mapValues, orderBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { TransactionMemo } from '@/constants/analytics';
import { timeUnits } from '@/constants/time';
import { IndexerPerpetualMarketType, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { assertNever } from '@/lib/assertNever';
import { calc, mapIfPresent } from '@/lib/do';
import { FALLBACK_MARKET_LEVERAGE } from '@/lib/marketsHelpers';
import { AttemptNumber, MAX_INT_ROUGHLY, MustBigNumber } from '@/lib/numbers';
import { isPresent } from '@/lib/typeUtils';

import { PlaceOrderMarketInfo, PlaceOrderPayload } from '../triggers/types';
import { getTradeFormFieldStates, isFieldStateEnabled, isFieldStateRelevant } from './fields';
import { calculateTradeInfo } from './tradeInfo';
import {
  ExecutionType,
  GoodUntilTime,
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

  const tradePayload = calc((): PlaceOrderPayload | undefined => {
    return mapIfPresent(
      accountData.currentTradeMarketSummary,
      effectiveTrade.marketId,
      effectiveTrade.type,
      effectiveTrade.side,
      AttemptNumber(tradeInfo.inputSummary.size?.size),
      AttemptNumber(tradeInfo.payloadPrice),
      (market, marketId, type, side, size, price): PlaceOrderPayload | undefined => {
        const triggerPrice = AttemptNumber(effectiveTrade.triggerPrice);
        if (options.needsTriggerPrice && triggerPrice == null) {
          return undefined;
        }
        const goodTilTimeParsed = AttemptNumber(getGoodTilInSeconds(effectiveTrade.goodTil));
        if (options.needsGoodTil && (goodTilTimeParsed == null || effectiveTrade.goodTil == null)) {
          return undefined;
        }
        const clobPairId = AttemptNumber(market.clobPairId);
        if (clobPairId == null) {
          return undefined;
        }
        const marketInfo: PlaceOrderMarketInfo = {
          clobPairId,
          atomicResolution: market.atomicResolution,
          stepBaseQuantums: market.stepBaseQuantums,
          quantumConversionExponent: market.quantumConversionExponent,
          subticksPerTick: market.subticksPerTick,
        };

        const clientId = Math.floor(Math.random() * MAX_INT_ROUGHLY);

        return {
          subaccountNumber: tradeInfo.subaccountNumber,
          transferToSubaccountAmount: tradeInfo.transferToSubaccountAmount,
          marketId,
          type: tradeFormTypeToOrderType(type),
          side,
          price,
          size,
          clientId,
          timeInForce: calc(() => {
            if (options.timeInForceOptions.length === 0) {
              return undefined;
            }

            if (effectiveTrade.type === TradeFormType.MARKET) {
              return OrderTimeInForce.IOC;
            }

            if (effectiveTrade.timeInForce == null) {
              return OrderTimeInForce.IOC;
            }
            if (effectiveTrade.timeInForce === TimeInForce.IOC) {
              return OrderTimeInForce.IOC;
            }
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (effectiveTrade.timeInForce === TimeInForce.GTT) {
              return OrderTimeInForce.GTT;
            }
            assertNever(effectiveTrade.timeInForce);
            return OrderTimeInForce.IOC;
          }),
          postOnly: options.needsPostOnly ? effectiveTrade.postOnly : undefined,
          reduceOnly: options.needsReduceOnly ? effectiveTrade.reduceOnly : undefined,
          triggerPrice: options.needsTriggerPrice ? triggerPrice : undefined,
          execution: calc(() => {
            if (options.executionOptions.length > 0) {
              if (effectiveTrade.execution == null) {
                return OrderExecution.DEFAULT;
              }
              if (effectiveTrade.execution === ExecutionType.GOOD_TIL_DATE) {
                return OrderExecution.DEFAULT;
              }
              if (effectiveTrade.execution === ExecutionType.IOC) {
                return OrderExecution.IOC;
              }
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (effectiveTrade.execution === ExecutionType.POST_ONLY) {
                return OrderExecution.POST_ONLY;
              }
              assertNever(effectiveTrade.execution);
            }
            return undefined;
          }),
          goodTilTimeInSeconds: options.needsGoodTil ? goodTilTimeParsed : undefined,
          marketInfo,
          // will be provided at submission time
          goodTilBlock: undefined,
          currentHeight: undefined,
          memo: TransactionMemo.placeOrder,
        };
      }
    );
    return undefined;
  });
  return {
    effectiveTrade,
    options,

    tradeInfo,
    tradePayload,

    accountDetailsBefore: baseAccount,
    accountDetailsAfter: baseAccountAfter,
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
      showLeverage: false,
      showAmountClose: false,

      needsMarginMode: false,
      needsSize: false,
      needsLimitPrice: false,
      needsTargetLeverage: false,
      needsTriggerPrice: false,
      needsGoodTil: false,
      needsReduceOnly: false,
      needsPostOnly: false,
      showReduceOnlyTooltip: false,
      showPostOnlyTooltip: false,
      needsTimeInForce: false,
      needsExecution: false,

      showSize: false,
      showReduceOnly: false,
      showMarginMode: false,
      showTargetLeverage: false,
      showLimitPrice: false,
      showPostOnly: false,
      showTimeInForce: false,
      showTriggerPrice: false,
      showExecution: false,
      showGoodTil: false,
    },
    tradePayload: undefined,
    accountDetailsAfter: undefined,
    accountDetailsBefore: undefined,
    tradeInfo: {
      inputSummary: {
        size: undefined,
        averageFillPrice: undefined,
        worstFillPrice: undefined,
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

  const options: TradeFormOptions = {
    orderTypeOptions,
    executionOptions,
    timeInForceOptions,
    goodTilUnitOptions,

    needsTargetLeverage: isFieldStateRelevant(fields.targetLeverage),
    needsMarginMode: isFieldStateRelevant(fields.marginMode),
    needsSize: isFieldStateRelevant(fields.size),
    needsLimitPrice: isFieldStateRelevant(fields.limitPrice),
    needsTriggerPrice: isFieldStateRelevant(fields.triggerPrice),
    needsGoodTil: isFieldStateRelevant(fields.goodTil),
    needsReduceOnly: isFieldStateRelevant(fields.reduceOnly),
    needsPostOnly: isFieldStateRelevant(fields.postOnly),
    needsTimeInForce: isFieldStateRelevant(fields.timeInForce),
    needsExecution: isFieldStateRelevant(fields.execution),

    showLeverage: orderType === TradeFormType.MARKET && isCross && (!reduceOnly || !isDecreasing),
    showAmountClose: orderType === TradeFormType.MARKET && !!reduceOnly && isDecreasing,

    showTargetLeverage:
      isFieldStateEnabled(fields.targetLeverage) &&
      (orderType !== TradeFormType.MARKET || !reduceOnly),

    showMarginMode: isFieldStateEnabled(fields.marginMode),
    showSize: isFieldStateEnabled(fields.size),
    showLimitPrice: isFieldStateEnabled(fields.limitPrice),
    showTriggerPrice: isFieldStateEnabled(fields.triggerPrice),
    showGoodTil: isFieldStateEnabled(fields.goodTil),
    showTimeInForce: isFieldStateEnabled(fields.timeInForce),
    showExecution: isFieldStateEnabled(fields.execution),
    showReduceOnly: isFieldStateEnabled(fields.reduceOnly),
    showPostOnly: isFieldStateEnabled(fields.postOnly),

    showPostOnlyTooltip: fields.postOnly.state === 'disabled',
    showReduceOnlyTooltip: fields.reduceOnly.state === 'disabled',
  };
  return options;
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

export function tradeFormTypeToOrderType(tradeFormType: TradeFormType): OrderType {
  switch (tradeFormType) {
    case TradeFormType.MARKET:
      return OrderType.MARKET;
    case TradeFormType.LIMIT:
      return OrderType.LIMIT;
    case TradeFormType.STOP_MARKET:
      return OrderType.STOP_MARKET;
    case TradeFormType.STOP_LIMIT:
      return OrderType.STOP_LIMIT;
    case TradeFormType.TAKE_PROFIT_MARKET:
      return OrderType.TAKE_PROFIT_MARKET;
    case TradeFormType.TAKE_PROFIT_LIMIT:
      // Note: There's a naming difference here - TAKE_PROFIT_LIMIT maps to TAKE_PROFIT
      return OrderType.TAKE_PROFIT_LIMIT;
    default:
      assertNever(tradeFormType);
      return OrderType.MARKET;
  }
}

export function orderTypeToTradeFormType(orderType: OrderType): TradeFormType {
  switch (orderType) {
    case OrderType.MARKET:
      return TradeFormType.MARKET;
    case OrderType.LIMIT:
      return TradeFormType.LIMIT;
    case OrderType.STOP_MARKET:
      return TradeFormType.STOP_MARKET;
    case OrderType.STOP_LIMIT:
      return TradeFormType.STOP_LIMIT;
    case OrderType.TAKE_PROFIT_MARKET:
      return TradeFormType.TAKE_PROFIT_MARKET;
    case OrderType.TAKE_PROFIT_LIMIT:
      // Note: Handling the naming difference in reverse
      return TradeFormType.TAKE_PROFIT_LIMIT;
    default:
      assertNever(orderType);
      return TradeFormType.MARKET;
  }
}

export function getGoodTilInSeconds(goodTil: GoodUntilTime | undefined) {
  if (goodTil == null) {
    return undefined;
  }
  const duration = AttemptNumber(goodTil.duration);
  if (duration == null || duration < 0) {
    return undefined;
  }
  const unit = goodTil.unit;
  if (unit === TimeUnit.DAY) {
    return (timeUnits.day * duration) / timeUnits.second;
  }
  if (unit === TimeUnit.HOUR) {
    return (timeUnits.hour * duration) / timeUnits.second;
  }
  if (unit === TimeUnit.MINUTE) {
    return (timeUnits.minute * duration) / timeUnits.second;
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (unit === TimeUnit.WEEK) {
    return (timeUnits.week * duration) / timeUnits.second;
  }
  assertNever(unit);
  return undefined;
}
