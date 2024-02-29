import { OrderSide } from '@dydxprotocol/v4-client-js';
import { type Location, matchPath } from 'react-router-dom';

import {
  type Nullable,
  AbacusOrderSide,
  type AbacusOrderSides,
  AbacusOrderTypes,
  ValidationError,
  ErrorType,
} from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { StringGetterFunction } from '@/constants/localization';
import { PERCENT_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { TRADE_ROUTE } from '@/constants/routes';
import { PositionSide, TradeTypes } from '@/constants/trade';

import { MustBigNumber } from '@/lib/numbers';

export const getMarketIdFromLocation = (location: Location) => {
  const { pathname } = location;
  const tradeMatch = matchPath(TRADE_ROUTE, pathname);
  return tradeMatch?.params.market;
};

export const getSelectedTradeType = (type: Nullable<AbacusOrderTypes>) => {
  return type ? (type.rawValue as TradeTypes) : TradeTypes.LIMIT;
};

export const getSelectedOrderSide = (side: Nullable<AbacusOrderSides>) => {
  return side === AbacusOrderSide.sell ? OrderSide.SELL : OrderSide.BUY;
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
      return value || '';
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
  const inputAlerts = abacusInputErrors.map(({ action: errorAction, resources, type }) => {
    const { action, text } = resources || {};
    const { stringKey: actionStringKey } = action || {};
    const { stringKey: alertStringKey, params: stringParams } = text || {};

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
    };
  });

  return inputAlerts?.[0];
};
