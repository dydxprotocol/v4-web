import { SubaccountPosition } from '@/bonsai/types/summaryTypes';
import BigNumber from 'bignumber.js';
import { mapValues } from 'lodash';

import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { assertNever } from '@/lib/assertNever';
import { calc } from '@/lib/do';
import { FALLBACK_MARKET_LEVERAGE } from '@/lib/marketsHelpers';

import {
  ExecutionType,
  FieldState,
  GoodUntilTime,
  MarginMode,
  OrderSide,
  OrderSizeInputs,
  TimeInForce,
  TimeUnit,
  TradeForm,
  TradeFormFieldStates,
  TradeFormType,
} from './types';

export const DEFAULT_TRADE_TYPE = TradeFormType.MARKET;

const DEFAULT_GOOD_TIL_TIME: GoodUntilTime = {
  duration: '28',
  unit: TimeUnit.DAY,
};

const DEFAULT_ISOLATED_TARGET_LEVERAGE = 2.0;

export function getTradeFormFieldStates(
  form: TradeForm,
  existingPositionOrOpenOrderMarginMode: MarginMode | undefined,
  existingPosition: SubaccountPosition | undefined,
  marketIsIsolatedOnly: boolean | undefined
): TradeFormFieldStates {
  const { type } = form;

  const existingPositionLeverage = existingPosition?.leverage?.toNumber();
  const maxMarketLeverage = existingPosition?.maxLeverage?.toNumber() ?? FALLBACK_MARKET_LEVERAGE;
  const existingPositionSide = existingPosition?.side;

  const defaultTargetLeverage = calc(() => {
    if (
      existingPositionOrOpenOrderMarginMode === MarginMode.ISOLATED &&
      existingPositionLeverage != null
    ) {
      return BigNumber.min(existingPositionLeverage, maxMarketLeverage);
    }
    return BigNumber.min(DEFAULT_ISOLATED_TARGET_LEVERAGE, maxMarketLeverage);
  });

  const defaults: Required<TradeForm> = {
    type: DEFAULT_TRADE_TYPE,
    marketId: '',
    side: OrderSide.BUY,
    size: OrderSizeInputs.SIZE({ value: '' }),
    reduceOnly: false,
    marginMode: MarginMode.CROSS,
    targetLeverage: defaultTargetLeverage.toString(10),
    limitPrice: '',
    postOnly: false,
    timeInForce: TimeInForce.GTT,
    triggerPrice: '',
    execution: ExecutionType.GOOD_TIL_DATE,
    goodTil: DEFAULT_GOOD_TIL_TIME,
  };

  // Initialize all fields as not visible
  const baseResult: TradeFormFieldStates = mapValues(
    defaults,
    (_default, key): FieldState<TradeForm[keyof TradeForm]> => ({
      rawValue: form[key as keyof TradeForm],
      effectiveValue: undefined,
      state: 'irrelevant',
    })
  ) as TradeFormFieldStates;

  function targetLeverageVisibleIfIsolated(result: TradeFormFieldStates): void {
    if (result.marginMode.effectiveValue === MarginMode.ISOLATED) {
      makeVisible(result, ['targetLeverage']);
    }
  }

  function setMarginMode(result: TradeFormFieldStates): void {
    if (marketIsIsolatedOnly) {
      forceValueAndDisable(result.marginMode, MarginMode.ISOLATED);
    } else if (existingPositionOrOpenOrderMarginMode != null) {
      forceValueAndDisable(result.marginMode, existingPositionOrOpenOrderMarginMode);
    } else {
      makeVisible(result, ['marginMode']);
    }
  }

  function makeVisible(states: TradeFormFieldStates, keys: Array<keyof TradeFormFieldStates>) {
    keys.forEach((key) => {
      states[key] = {
        ...(states[key] as any),
        state: 'enabled',
        effectiveValue: states[key].effectiveValue ?? states[key].rawValue ?? defaults[key],
      };
    });
  }

  function defaultSizeIfSizeInputIsInvalid(states: TradeFormFieldStates) {
    if (
      states.size.effectiveValue?.type === 'AVAILABLE_PERCENT' ||
      states.size.effectiveValue?.type === 'SIGNED_POSITION_LEVERAGE'
    ) {
      states.size.effectiveValue = defaults.size;
    }
  }

  function disableReduceOnlyIfIncreasingMarketOrder(states: TradeFormFieldStates) {
    if (
      // market order
      states.type.effectiveValue === TradeFormType.MARKET &&
      // reduce only is undefined or false
      !states.reduceOnly.effectiveValue &&
      // no existing position or same side
      (existingPositionSide == null ||
        (existingPositionSide === IndexerPositionSide.LONG &&
          states.side.effectiveValue === OrderSide.BUY) ||
        (existingPositionSide === IndexerPositionSide.SHORT &&
          states.side.effectiveValue === OrderSide.SELL))
    ) {
      forceValueAndDisable(states.reduceOnly, false);
    }
  }

  return calc(() => {
    const result = { ...baseResult };
    makeVisible(result, ['type']);
    switch (type) {
      case TradeFormType.MARKET:
        makeVisible(result, ['marketId', 'side', 'size', 'marginMode', 'reduceOnly']);
        setMarginMode(result);
        targetLeverageVisibleIfIsolated(result);
        disableReduceOnlyIfIncreasingMarketOrder(result);

        return result;
      case TradeFormType.LIMIT:
        makeVisible(result, [
          'timeInForce',
          'limitPrice',
          'size',
          'side',
          'marketId',
          'marginMode',
          'reduceOnly',
          'postOnly',
        ]);
        defaultSizeIfSizeInputIsInvalid(result);
        setMarginMode(result);
        targetLeverageVisibleIfIsolated(result);

        // goodTil is only visible and required for GTT
        if (result.timeInForce.effectiveValue === TimeInForce.GTT) {
          makeVisible(result, ['goodTil']);
          forceValueAndDisable(result.reduceOnly, false);
        } else if (result.timeInForce.effectiveValue === TimeInForce.IOC) {
          forceValueAndDisable(result.postOnly, false);
        }

        return result;
      case TradeFormType.STOP_LIMIT:
      case TradeFormType.TAKE_PROFIT_LIMIT:
        makeVisible(result, [
          'marketId',
          'side',
          'marginMode',
          'triggerPrice',
          'limitPrice',
          'size',
          'goodTil',
          'execution',
          'reduceOnly',
        ]);
        defaultSizeIfSizeInputIsInvalid(result);
        setMarginMode(result);
        targetLeverageVisibleIfIsolated(result);

        // reduceOnly is only visible when execution is IOC
        if (result.execution.effectiveValue !== ExecutionType.IOC) {
          forceValueAndDisable(result.reduceOnly, false);
        }
        return result;
      case TradeFormType.STOP_MARKET:
      case TradeFormType.TAKE_PROFIT_MARKET:
        makeVisible(result, [
          'marketId',
          'side',
          'marginMode',
          'triggerPrice',
          'size',
          'goodTil',
          'execution',
          'reduceOnly',
        ]);
        defaultSizeIfSizeInputIsInvalid(result);
        setMarginMode(result);
        targetLeverageVisibleIfIsolated(result);

        // Execution is fixed for stop market
        forceValueAndDisable(result.execution, ExecutionType.IOC);
        return result;
      default:
        assertNever(type);
        return result;
    }
    return result;
  });
}

function forceValueAndDisable<T>(field: FieldState<T>, forceValue: NonNullable<T>) {
  field.state = 'disabled';
  field.effectiveValue = forceValue;
}

export function isFieldStateRelevant<T>(field: FieldState<T>) {
  return field.state === 'enabled' || field.state === 'disabled';
}

export function isFieldStateEnabled<T>(field: FieldState<T>) {
  return field.state === 'enabled';
}
