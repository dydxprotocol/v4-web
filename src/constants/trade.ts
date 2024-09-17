import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';
import { TimeUnitShort } from '@/constants/time';

import { ErrorParams } from './errors';

export enum TradeTypes {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP_LIMIT = 'STOP_LIMIT',
  STOP_MARKET = 'STOP_MARKET',
  TAKE_PROFIT = 'TAKE_PROFIT',
  TAKE_PROFIT_MARKET = 'TAKE_PROFIT_MARKET',
  TRAILING_STOP = 'TRAILING_STOP',
}

enum ClosingTradeTypes {
  LIQUIDATED = 'LIQUIDATED',
  LIQUIDATION = 'LIQUIDATION',
  OFFSETTING = 'OFFSETTING',
  DELEVERAGED = 'DELEVERAGED',
  FINAL_SETTLEMENT = 'FINAL_SETTLEMENT',
}

export type OrderType = TradeTypes | ClosingTradeTypes;

export enum PositionSide {
  None = 'NONE',
  Long = 'LONG',
  Short = 'SHORT',
}

export const UNCOMMITTED_ORDER_TIMEOUT_MS = 10_000;

export const POSITION_SIDE_STRINGS: Record<PositionSide, string> = {
  [PositionSide.None]: STRING_KEYS.NONE,
  [PositionSide.Long]: STRING_KEYS.LONG_POSITION_SHORT,
  [PositionSide.Short]: STRING_KEYS.SHORT_POSITION_SHORT,
};

export const ORDER_TYPE_STRINGS: Record<
  OrderType,
  {
    orderTypeKeyShort: string;
    orderTypeKey: string;
    descriptionKey: string | null;
  }
> = {
  [TradeTypes.LIMIT]: {
    orderTypeKeyShort: STRING_KEYS.LIMIT_ORDER_SHORT,
    orderTypeKey: STRING_KEYS.LIMIT_ORDER,
    descriptionKey: STRING_KEYS.LIMIT_ORDER_DESCRIPTION,
  },
  [TradeTypes.MARKET]: {
    orderTypeKeyShort: STRING_KEYS.MARKET_ORDER_SHORT,
    orderTypeKey: STRING_KEYS.MARKET_ORDER,
    descriptionKey: STRING_KEYS.MARKET_ORDER_DESCRIPTION,
  },
  [TradeTypes.STOP_LIMIT]: {
    orderTypeKeyShort: STRING_KEYS.STOP_LIMIT,
    orderTypeKey: STRING_KEYS.STOP_LIMIT,
    descriptionKey: STRING_KEYS.STOP_LIMIT_DESCRIPTION,
  },
  [TradeTypes.STOP_MARKET]: {
    orderTypeKeyShort: STRING_KEYS.STOP_MARKET,
    orderTypeKey: STRING_KEYS.STOP_MARKET,
    descriptionKey: STRING_KEYS.STOP_MARKET_DESCRIPTION,
  },
  [TradeTypes.TAKE_PROFIT]: {
    orderTypeKeyShort: STRING_KEYS.TAKE_PROFIT_LIMIT_SHORT,
    orderTypeKey: STRING_KEYS.TAKE_PROFIT_LIMIT,
    descriptionKey: STRING_KEYS.TAKE_PROFIT_LIMIT_DESCRIPTION,
  },
  [TradeTypes.TAKE_PROFIT_MARKET]: {
    orderTypeKeyShort: STRING_KEYS.TAKE_PROFIT_MARKET_SHORT,
    orderTypeKey: STRING_KEYS.TAKE_PROFIT_MARKET,
    descriptionKey: STRING_KEYS.TAKE_PROFIT_MARKET_DESCRIPTION,
  },
  [TradeTypes.TRAILING_STOP]: {
    orderTypeKeyShort: STRING_KEYS.TRAILING_STOP,
    orderTypeKey: STRING_KEYS.TRAILING_STOP,
    descriptionKey: STRING_KEYS.TRAILING_STOP_DESCRIPTION,
  },
  [ClosingTradeTypes.LIQUIDATED]: {
    orderTypeKeyShort: STRING_KEYS.LIQUIDATED,
    orderTypeKey: STRING_KEYS.LIQUIDATED,
    descriptionKey: null,
  },
  [ClosingTradeTypes.LIQUIDATION]: {
    orderTypeKeyShort: STRING_KEYS.LIQUIDATION,
    orderTypeKey: STRING_KEYS.LIQUIDATION,
    descriptionKey: null,
  },
  [ClosingTradeTypes.OFFSETTING]: {
    orderTypeKeyShort: STRING_KEYS.OFFSETTING,
    orderTypeKey: STRING_KEYS.OFFSETTING,
    descriptionKey: null,
  },
  [ClosingTradeTypes.DELEVERAGED]: {
    orderTypeKeyShort: STRING_KEYS.DELEVERAGED,
    orderTypeKey: STRING_KEYS.DELEVERAGED,
    descriptionKey: null,
  },
  [ClosingTradeTypes.FINAL_SETTLEMENT]: {
    orderTypeKeyShort: STRING_KEYS.FINAL_SETTLEMENT,
    orderTypeKey: STRING_KEYS.FINAL_SETTLEMENT,
    descriptionKey: null,
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

export type TradeToggleSizeInput = TradeSizeInput.Size | TradeSizeInput.Usdc;

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
  PlaceOrderFailed = 'PlaceOrderFailed',
}

export const CLEARED_TRADE_INPUTS = {
  limitPriceInput: '',
  triggerPriceInput: '',
  trailingPercentInput: '',
};

export const CLEARED_SIZE_INPUTS = {
  amountInput: '',
  usdAmountInput: '',
  leverageInput: '',
};

export enum PlaceOrderStatuses {
  Submitted = 0,
  Placed = 1,
  Filled = 2,
  Canceled = 3,
}

export enum CancelOrderStatuses {
  Submitted = 0,
  Canceled = 1,
}

export type LocalPlaceOrderData = {
  marketId: string;
  clientId: string;
  orderId?: string;
  orderType: TradeTypes;
  submissionStatus: PlaceOrderStatuses;
  errorParams?: ErrorParams;
};

export type LocalCancelOrderData = {
  orderId: string;
  submissionStatus: CancelOrderStatuses;
  errorParams?: ErrorParams;
  isSubmittedThroughCancelAll?: boolean;
};

export const CANCEL_ALL_ORDERS_KEY = 'all';
export type LocalCancelAllData = {
  key: string;
  orderIds: string[];
  canceledOrderIds?: string[];
  failedOrderIds?: string[];
  errorParams?: ErrorParams;
};
