import BigNumber from 'bignumber.js';
import { mapValues } from 'lodash';

import { assertNever } from '@/lib/assertNever';
import { calc } from '@/lib/do';

import {
  ClosePositionSizeInputs,
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

export function getTradeFormFieldStates(
  form: TradeForm,
  existingPositionMarginMode: MarginMode | undefined,
  maxMarketLeverage: number
): TradeFormFieldStates {
  const { type } = form;

  const defaults: Required<TradeForm> = {
    type: TradeFormType.LIMIT,
    marketId: '',
    side: OrderSide.BUY,
    size: OrderSizeInputs.SIZE({ value: '' }),
    reduceOnly: false,
    marginMode: MarginMode.CROSS,
    targetLeverage: BigNumber.min(2, maxMarketLeverage).toString(10),
    limitPrice: '',
    postOnly: false,
    timeInForce: TimeInForce.GTT,
    triggerPrice: '',
    execution: ExecutionType.GOOD_TIL_DATE,
    goodTil: DEFAULT_GOOD_TIL_TIME,
    positionId: '',
    closeSize: ClosePositionSizeInputs.POSITION_PERCENT({ value: '100' }),
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

  function modifyField<T>(
    field: FieldState<T>,
    state: FieldState<T>['state'],
    forceValue?: NonNullable<T>
  ): FieldState<T> {
    return {
      ...field,
      state,
      ...(forceValue != null ? { renderedValue: forceValue } : {}),
    };
  }
  function makeVisible(states: TradeFormFieldStates, keys: Array<keyof TradeFormFieldStates>) {
    keys.forEach((key) => {
      states[key] = {
        ...(states[key] as any),
        effectiveValue: states[key].rawValue ?? states[key].effectiveValue ?? defaults[key],
        state: 'visible',
      };
    });
  }
  function forceValueAndDisable<T>(field: FieldState<T>, forceValue: NonNullable<T>) {
    field.state = 'visible-disabled';
    field.effectiveValue = forceValue;
  }
  function forceValueAndHide<T>(field: FieldState<T>, forceValue: NonNullable<T>) {
    field.state = 'relevant-hidden';
    field.effectiveValue = forceValue;
  }

  function setMarginMode(result: TradeFormFieldStates): void {
    if (existingPositionMarginMode != null) {
      // Force the margin mode to match existing position and disable it
      result.marginMode = modifyField(
        result.marginMode,
        'visible-disabled',
        existingPositionMarginMode
      );
    } else {
      result.marginMode = modifyField(result.marginMode, 'visible');
    }
  }

  function handleSizeInput(result: TradeFormFieldStates): void {
    // LEVERAGE input should only be visible for CROSS margin
    if (form.size?.type === 'LEVERAGE' && result.marginMode.effectiveValue !== MarginMode.CROSS) {
      // Reset to SIZE input if leverage is selected but margin mode isn't CROSS
      result.size = modifyField(result.size, 'visible', OrderSizeInputs.SIZE({ value: '' }));
    }
  }

  function setTargetLeverage(result: TradeFormFieldStates): void {
    if (result.marginMode.effectiveValue === MarginMode.ISOLATED) {
      result.targetLeverage = modifyField(result.targetLeverage, 'visible');
    }
  }

  baseResult.type = modifyField(baseResult.type, 'visible');

  return calc(() => {
    const result = { ...baseResult };
    switch (type) {
      case TradeFormType.MARKET:
        makeVisible(result, ['marketId', 'side', 'size', 'marginMode', 'reduceOnly']);
        setMarginMode(result);
        handleSizeInput(result);
        setTargetLeverage(result);

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
        handleSizeInput(result);
        setTargetLeverage(result);

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
        handleSizeInput(result);
        setTargetLeverage(result);

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
        handleSizeInput(result);
        setTargetLeverage(result);

        // Execution is fixed for stop market
        forceValueAndDisable(result.execution, ExecutionType.IOC);
        return result;
      case TradeFormType.CLOSE_POSITION:
        forceValueAndHide(result.type, TradeFormType.CLOSE_POSITION);
        makeVisible(result, ['positionId', 'closeSize']);
        return result;
      default:
        assertNever(type);
        return result;
    }
    return result;
  });
}
