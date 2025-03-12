import { getPositionUniqueId } from '@/bonsai/calculators/helpers';
import {
  calculateParentSubaccountPositions,
  calculateParentSubaccountSummary,
} from '@/bonsai/calculators/subaccount';
import { MarketsData, ParentSubaccountDataBase } from '@/bonsai/types/rawTypes';
import {
  GroupedSubaccountSummary,
  PositionUniqueId,
  SubaccountPosition,
} from '@/bonsai/types/summaryTypes';
import { orderBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { mapIfPresent } from '@/lib/do';
import { calculateMarketMaxLeverage } from '@/lib/marketsHelpers';
import { AttemptNumber } from '@/lib/numbers';

import { getTradeFormFieldStates } from './fields';
import {
  ExecutionType,
  MarginMode,
  matchOrderType,
  SelectionOption,
  TimeInForce,
  TimeUnit,
  TradeForm,
  TradeFormInputData,
  TradeFormOptions,
  TradeFormSummary,
  TradeFormType,
} from './types';

export function getTradeSummary(
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

  const fieldStates = getTradeFormFieldStates(
    state,
    baseAccount?.position?.marginMode === 'CROSS' ? MarginMode.CROSS : MarginMode.ISOLATED,
    calculateMarketMaxLeverage({
      effectiveInitialMarginFraction:
        accountData.currentTradeMarketSummary?.effectiveInitialMarginFraction,
      initialMarginFraction: AttemptNumber(
        accountData.currentTradeMarketSummary?.initialMarginFraction
      ),
    })
  );
  const options = calculateTradeFormOptions(fieldStates.type.renderedValue);

  return {
    fieldStates,
    options,

    tradeInfo,

    accountBefore: baseAccount?.account,
    positionBefore: baseAccount?.position,

    accountAfter,
    positionAfter,
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
  { value: ExecutionType.DEFAULT, stringKey: 'APP.TRADE.GOOD_TIL_DATE' },
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

function calculateTradeFormOptions(orderType: TradeFormType | undefined): TradeFormOptions {
  const executionOptions: SelectionOption<ExecutionType>[] = orderType
    ? matchOrderType(orderType, {
        [TradeFormType.LIMIT]: () => allExecutionOptions,
        [TradeFormType.STOP_LIMIT]: () => allExecutionOptions,
        [TradeFormType.TAKE_PROFIT_LIMIT]: () => allExecutionOptions,
        [TradeFormType.MARKET]: () => iocOnlyExecutionOptions,
        [TradeFormType.STOP_MARKET]: () => iocOnlyExecutionOptions,
        [TradeFormType.TAKE_PROFIT_MARKET]: () => iocOnlyExecutionOptions,
        [TradeFormType.CLOSE_POSITION]: () => emptyExecutionOptions,
      })
    : emptyExecutionOptions;

  return {
    orderTypeOptions,
    executionOptions,
    timeInForceOptions,
    goodTilUnitOptions,
  };
}

function getRelevantAccountDetails(
  rawParentSubaccountData: ParentSubaccountDataBase,
  rawRelevantMarkets: MarketsData,
  positionUniqueId?: PositionUniqueId
): { account: GroupedSubaccountSummary; position?: SubaccountPosition } {
  const account = calculateParentSubaccountSummary(rawParentSubaccountData, rawRelevantMarkets);
  const positions = calculateParentSubaccountPositions(rawParentSubaccountData, rawRelevantMarkets);
  const position = positions.find(
    (p) => positionUniqueId != null && p.uniqueId === positionUniqueId
  );
  return { position, account };
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
