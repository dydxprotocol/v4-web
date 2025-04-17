import { OrderSide } from '@dydxprotocol/v4-client-js';

import {
  AbacusMarginMode,
  AbacusOrderSide,
  AbacusOrderTypes,
  ErrorFormat,
  type AbacusOrderSides,
  type ErrorFormatType,
} from '@/constants/abacus';
import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import { PERCENT_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { PositionSide, TradeTypes } from '@/constants/trade';

import { MustBigNumber } from '@/lib/numbers';
import { Nullable } from '@/lib/typeUtils';

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
  format: Nullable<ErrorFormatType>;
  stepSizeDecimals: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
}) => {
  switch (format) {
    case ErrorFormat.Percent: {
      const percentBN = MustBigNumber(value);
      return `${percentBN.times(100).toFixed(PERCENT_DECIMALS)}%`;
    }
    case ErrorFormat.Size: {
      const sizeBN = MustBigNumber(value);
      return sizeBN.toFixed(stepSizeDecimals ?? 0);
    }
    case ErrorFormat.Price: {
      const dollarBN = MustBigNumber(value);
      return `$${dollarBN.toFixed(tickSizeDecimals ?? USD_DECIMALS)}`;
    }
    case ErrorFormat.UsdcPrice: {
      const dollarBN = MustBigNumber(value);
      return `$${dollarBN.toFixed(USD_DECIMALS)}`;
    }
    default: {
      return value ?? '';
    }
  }
};

export const calculateCrossPositionMargin = ({
  notionalTotal,
  adjustedImf,
}: {
  notionalTotal?: Nullable<number>;
  adjustedImf?: Nullable<number>;
}) => {
  const notionalTotalBN = MustBigNumber(notionalTotal);
  const adjustedImfBN = MustBigNumber(adjustedImf);
  return notionalTotalBN.times(adjustedImfBN).toFixed(USD_DECIMALS);
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

export const getDoubleValuesHasDiff = (current: Nullable<number>, post: Nullable<number>) => {
  return post != null && current !== post;
};
