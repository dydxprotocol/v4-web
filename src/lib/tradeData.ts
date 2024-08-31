import { OrderSide } from '@dydxprotocol/v4-client-js';

import {
  AbacusMarginMode,
  AbacusOrderSide,
  AbacusOrderTypes,
  ErrorType,
  ValidationError,
  type AbacusOrderSides,
  type Nullable,
  type SubaccountPosition,
  type TradeState,
} from '@/constants/abacus';
import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import type { StringGetterFunction } from '@/constants/localization';
import { PERCENT_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { PositionSide, TradeTypes } from '@/constants/trade';

import { MustBigNumber } from '@/lib/numbers';

export const getSelectedTradeType = (type: Nullable<AbacusOrderTypes>) => {
  return type ? (type.rawValue as TradeTypes) : TradeTypes.LIMIT;
};

export const getSelectedOrderSide = (side: Nullable<AbacusOrderSides>) => {
  return side === AbacusOrderSide.Sell ? OrderSide.SELL : OrderSide.BUY;
};

export const hasPositionSideChanged = ({
  currentSize,
  postOrderSize,
}: {
  currentSize?: Nullable<number>;
  postOrderSize?: Nullable<number>;
}) => {
  const currentSizeBN = MustBigNumber(currentSize);
  const postOrderSizeBN = MustBigNumber(postOrderSize);

  const currentPositionSide = currentSizeBN.gt(0)
    ? PositionSide.Long
    : currentSizeBN.lt(0)
      ? PositionSide.Short
      : PositionSide.None;

  const newPositionSide = postOrderSizeBN.gt(0)
    ? PositionSide.Long
    : postOrderSizeBN.lt(0)
      ? PositionSide.Short
      : PositionSide.None;

  return {
    currentPositionSide,
    newPositionSide,
    positionSideHasChanged: postOrderSize !== undefined && currentPositionSide !== newPositionSide,
  };
};

const formatErrorParam = ({
  value,
  format,
  stepSizeDecimals,
  tickSizeDecimals,
}: {
  value: Nullable<string>;
  format?: Nullable<string>;
  stepSizeDecimals: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
}) => {
  switch (format) {
    case 'percent': {
      const percentBN = MustBigNumber(value);
      return `${percentBN.times(100).toFixed(PERCENT_DECIMALS)}%`;
    }
    case 'size': {
      const sizeBN = MustBigNumber(value);
      return sizeBN.toFixed(stepSizeDecimals ?? 0);
    }
    case 'price': {
      const dollarBN = MustBigNumber(value);
      return `$${dollarBN.toFixed(tickSizeDecimals ?? USD_DECIMALS)}`;
    }
    default: {
      return value ?? '';
    }
  }
};

/**
 * @description Returns the formatted input errors.
 */
export const getTradeInputAlert = ({
  abacusInputErrors,
  stringGetter,
  stepSizeDecimals,
  tickSizeDecimals,
}: {
  abacusInputErrors: ValidationError[];
  stringGetter: StringGetterFunction;
  stepSizeDecimals: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
}) => {
  const inputAlerts = abacusInputErrors.map(
    ({ action: errorAction, resources, type, code, linkText: linkTextStringKey, link }) => {
      const { action, text } = resources ?? {};
      const { stringKey: actionStringKey } = action ?? {};
      const { stringKey: alertStringKey, params: stringParams } = text ?? {};

      const params =
        stringParams?.toArray() &&
        Object.fromEntries(
          stringParams
            .toArray()
            .map(({ key, value, format }) => [
              key,
              formatErrorParam({ value, format, stepSizeDecimals, tickSizeDecimals }),
            ])
        );

      return {
        errorAction,
        actionStringKey,
        alertStringKey,
        alertString: alertStringKey && stringGetter({ key: alertStringKey, params }),
        type: type === ErrorType.warning ? AlertType.Warning : AlertType.Error,
        code,
        linkText: linkTextStringKey && stringGetter({ key: linkTextStringKey }),
        link,
      };
    }
  );

  return inputAlerts?.[0];
};

export const calculateCrossPositionMargin = ({
  notionalTotal,
  adjustedMmf,
}: {
  notionalTotal?: Nullable<number>;
  adjustedMmf?: Nullable<number>;
}) => {
  const notionalTotalBN = MustBigNumber(notionalTotal);
  const adjustedMmfBN = MustBigNumber(adjustedMmf);
  return notionalTotalBN.times(adjustedMmfBN).toFixed(USD_DECIMALS);
};

/**
 * @param subaccountNumber
 * @returns marginMode from subaccountNumber, defaulting to cross margin if subaccountNumber is undefined or null.
 * @note v4-web is assuming that subaccountNumber >= 128 is used as childSubaccounts. API Traders may utilize these subaccounts differently.
 */
export const getMarginModeFromSubaccountNumber = (subaccountNumber: Nullable<number>) => {
  if (!subaccountNumber) return AbacusMarginMode.Cross;

  return subaccountNumber >= NUM_PARENT_SUBACCOUNTS
    ? AbacusMarginMode.Isolated
    : AbacusMarginMode.Cross;
};

export const getPositionMargin = ({ position }: { position: SubaccountPosition }) => {
  const { childSubaccountNumber, equity, notionalTotal, adjustedMmf } = position;
  const marginMode = getMarginModeFromSubaccountNumber(childSubaccountNumber);

  const margin =
    marginMode === AbacusMarginMode.Cross
      ? calculateCrossPositionMargin({
          notionalTotal: notionalTotal?.current,
          adjustedMmf: adjustedMmf.current,
        })
      : equity?.current;

  return margin;
};

export const getTradeStateWithDoubleValuesHasDiff = (tradeState: Nullable<TradeState<number>>) => {
  return !!tradeState && tradeState.current !== tradeState.postOrder;
};
