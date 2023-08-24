import { OrderSide } from '@dydxprotocol/v4-client';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';
import { TimeUnitShort } from '@/constants/time';

// TODO: rename to OrderType
export enum TradeTypes {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP_LIMIT = 'STOP_LIMIT',
  STOP_MARKET = 'STOP_MARKET',
  TAKE_PROFIT = 'TAKE_PROFIT',
  TAKE_PROFIT_MARKET = 'TAKE_PROFIT_MARKET',
  TRAILING_STOP = 'TRAILING_STOP',
}

export enum TimeInForceOptions {
  GTT = 'GTT',
  FOK = 'FOK',
  IOC = 'IOC',
}

export enum PositionSide {
  None = 'NONE',
  Long = 'LONG',
  Short = 'SHORT',
}

export const UNCOMMITTED_ORDER_TIMEOUT = 10_000;

export const ORDER_SIDE_STRINGS = {
  [OrderSide.BUY]: STRING_KEYS.BUY,
  [OrderSide.SELL]: STRING_KEYS.SELL,
};

export const POSITION_SIDE_STRINGS: Record<PositionSide, string> = {
  [PositionSide.None]: STRING_KEYS.NONE,
  [PositionSide.Long]: STRING_KEYS.LONG_POSITION_SHORT,
  [PositionSide.Short]: STRING_KEYS.SHORT_POSITION_SHORT,
};

export const TRADE_TYPE_STRINGS: Record<
  TradeTypes,
  {
    tradeTypeKeyShort: string;
    tradeTypeKey: string;
    descriptionKey: string;
  }
> = {
  [TradeTypes.LIMIT]: {
    tradeTypeKeyShort: STRING_KEYS.LIMIT_ORDER_SHORT,
    tradeTypeKey: STRING_KEYS.LIMIT_ORDER,
    descriptionKey: STRING_KEYS.LIMIT_ORDER_DESCRIPTION,
  },
  [TradeTypes.MARKET]: {
    tradeTypeKeyShort: STRING_KEYS.MARKET_ORDER_SHORT,
    tradeTypeKey: STRING_KEYS.MARKET_ORDER,
    descriptionKey: STRING_KEYS.MARKET_ORDER_DESCRIPTION,
  },
  [TradeTypes.STOP_LIMIT]: {
    tradeTypeKeyShort: STRING_KEYS.STOP_LIMIT,
    tradeTypeKey: STRING_KEYS.STOP_LIMIT,
    descriptionKey: STRING_KEYS.STOP_LIMIT_DESCRIPTION,
  },
  [TradeTypes.STOP_MARKET]: {
    tradeTypeKeyShort: STRING_KEYS.STOP_MARKET,
    tradeTypeKey: STRING_KEYS.STOP_MARKET,
    descriptionKey: STRING_KEYS.STOP_MARKET_DESCRIPTION,
  },
  [TradeTypes.TAKE_PROFIT]: {
    tradeTypeKeyShort: STRING_KEYS.TAKE_PROFIT_LIMIT,
    tradeTypeKey: STRING_KEYS.TAKE_PROFIT_LIMIT,
    descriptionKey: STRING_KEYS.TAKE_PROFIT_LIMIT_DESCRIPTION,
  },
  [TradeTypes.TAKE_PROFIT_MARKET]: {
    tradeTypeKeyShort: STRING_KEYS.TAKE_PROFIT_MARKET,
    tradeTypeKey: STRING_KEYS.TAKE_PROFIT_MARKET,
    descriptionKey: STRING_KEYS.TAKE_PROFIT_MARKET_DESCRIPTION,
  },
  [TradeTypes.TRAILING_STOP]: {
    tradeTypeKeyShort: STRING_KEYS.TRAILING_STOP,
    tradeTypeKey: STRING_KEYS.TRAILING_STOP,
    descriptionKey: STRING_KEYS.TRAILING_STOP_DESCRIPTION,
  },
};

export const GOOD_TIL_TIME_TIMESCALE_STRINGS: Record<TimeUnitShort, string> = {
  [TimeUnitShort.Minutes]: STRING_KEYS.MINUTES_SHORT,
  [TimeUnitShort.Hours]: STRING_KEYS.HOURS,
  [TimeUnitShort.Days]: STRING_KEYS.DAYS,
  [TimeUnitShort.Weeks]: STRING_KEYS.WEEKS,
};

export enum TradeSizeInput {
  Leverage = 'size.leverage',
  Size = 'size.size',
  Usdc = 'size.usdcSize',
}

export enum TradeBoxKeys {
  LimitPrice = 'price.limitPrice',
  TrailingPercent = 'price.trailingPercent',
  TriggerPrice = 'price.triggerPrice',
}

export type InputErrorData = {
  attached: boolean;
  message: string;
  type: AlertType;
};

export enum MobilePlaceOrderSteps {
  EditOrder = 'EditOrder',
  PreviewOrder = 'PreviewOrder',
  PlacingOrder = 'PlacingOrder',
  Confirmation = 'Confirmation',
}
