import BigNumber from 'bignumber.js';
import { mapValues } from 'lodash';

import { assertNever } from '@/lib/assertNever';
import { calc } from '@/lib/do';

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

const DEFAULT_GOOD_TIL_TIME: GoodUntilTime = {
  duration: '28',
  unit: TimeUnit.DAY,
};

const DEFAULT_ISOLATED_TARGET_LEVERAGE = 2.0;

export function getTradeFormFieldStates(
  form: TradeForm,
  existingPositionMarginMode: MarginMode | undefined,
  existingPositionLeverage: number | undefined,
  maxMarketLeverage: number
): TradeFormFieldStates {
  const { type } = form;

  const defaultTargetLeverage = calc(() => {
    if (existingPositionMarginMode === MarginMode.ISOLATED && existingPositionLeverage != null) {
      return BigNumber.min(existingPositionLeverage, maxMarketLeverage);
    }
    return BigNumber.min(DEFAULT_ISOLATED_TARGET_LEVERAGE, maxMarketLeverage);
  });

  const defaults: Required<TradeForm> = {
    type: TradeFormType.LIMIT,
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
    if (existingPositionMarginMode != null) {
      forceValueAndDisable(result.marginMode, existingPositionMarginMode);
    } else {
      makeVisible(result, ['marginMode']);
    }
  }

  function makeVisible(states: TradeFormFieldStates, keys: Array<keyof TradeFormFieldStates>) {
    keys.forEach((key) => {
      states[key] = {
        ...(states[key] as any),
        effectiveValue: states[key].effectiveValue ?? states[key].rawValue ?? defaults[key],
        state: 'visible',
      };
    });
  }

  return calc(() => {
    const result = { ...baseResult };
    makeVisible(result, ['type']);
    switch (type) {
      case TradeFormType.MARKET:
        makeVisible(result, ['marketId', 'side', 'size', 'marginMode', 'reduceOnly']);
        setMarginMode(result);
        targetLeverageVisibleIfIsolated(result);

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
  field.state = 'visible-disabled';
  field.effectiveValue = forceValue;
}

export function isFieldStateVisible<T>(field: FieldState<T>) {
  return field.state === 'visible' || field.state === 'visible-disabled';
}

export function isFieldStateEnabled<T>(field: FieldState<T>) {
  return field.state === 'visible';
}
