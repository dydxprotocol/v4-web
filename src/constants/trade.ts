import { TradeFormType } from '@/bonsai/forms/trade/types';
import { OrderStatus } from '@/bonsai/types/summaryTypes';
import { OrderType as ClientOrderType } from '@dydxprotocol/v4-client-js';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';
import { TimeUnitShort } from '@/constants/time';
import { IndexerOrderType } from '@/types/indexer/indexerApiGen';

import { ErrorParams } from './errors';

export type OrderType = TradeFormType | IndexerOrderType;

export enum PositionSide {
  None = 'NONE',
  Long = 'LONG',
  Short = 'SHORT',
}

export const UNCOMMITTED_ORDER_TIMEOUT_MS = 10_000;
export const MARKET_ORDER_MAX_SLIPPAGE = 0.05;
export const SHORT_TERM_ORDER_DURATION = 20;
export const POST_TRANSFER_PLACE_ORDER_DELAY = 250;

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
  [TradeFormType.LIMIT]: {
    orderTypeKeyShort: STRING_KEYS.LIMIT_ORDER_SHORT,
    orderTypeKey: STRING_KEYS.LIMIT_ORDER,
    descriptionKey: STRING_KEYS.LIMIT_ORDER_DESCRIPTION,
  },
  [TradeFormType.MARKET]: {
    orderTypeKeyShort: STRING_KEYS.MARKET_ORDER_SHORT,
    orderTypeKey: STRING_KEYS.MARKET_ORDER,
    descriptionKey: STRING_KEYS.MARKET_ORDER_DESCRIPTION,
  },
  [TradeFormType.TRIGGER_LIMIT]: {
    orderTypeKeyShort: STRING_KEYS.STOP_LIMIT,
    orderTypeKey: STRING_KEYS.STOP_LIMIT,
    descriptionKey: STRING_KEYS.STOP_LIMIT_DESCRIPTION,
  },
  [TradeFormType.TRIGGER_MARKET]: {
    orderTypeKeyShort: STRING_KEYS.STOP_MARKET,
    orderTypeKey: STRING_KEYS.STOP_MARKET,
    descriptionKey: STRING_KEYS.STOP_MARKET_DESCRIPTION,
  },
  [IndexerOrderType.STOPMARKET]: {
    orderTypeKeyShort: STRING_KEYS.STOP_MARKET,
    orderTypeKey: STRING_KEYS.STOP_MARKET,
    descriptionKey: STRING_KEYS.STOP_MARKET_DESCRIPTION,
  },
  [IndexerOrderType.STOPLIMIT]: {
    orderTypeKeyShort: STRING_KEYS.STOP_LIMIT,
    orderTypeKey: STRING_KEYS.STOP_LIMIT,
    descriptionKey: STRING_KEYS.STOP_LIMIT_DESCRIPTION,
  },
  [IndexerOrderType.TAKEPROFITMARKET]: {
    orderTypeKeyShort: STRING_KEYS.TAKE_PROFIT_MARKET_SHORT,
    orderTypeKey: STRING_KEYS.TAKE_PROFIT_MARKET,
    descriptionKey: STRING_KEYS.TAKE_PROFIT_MARKET_DESCRIPTION,
  },

  [IndexerOrderType.TAKEPROFIT]: {
    orderTypeKeyShort: STRING_KEYS.TAKE_PROFIT_LIMIT_SHORT,
    orderTypeKey: STRING_KEYS.TAKE_PROFIT_LIMIT,
    descriptionKey: STRING_KEYS.TAKE_PROFIT_LIMIT_DESCRIPTION,
  },
  [IndexerOrderType.TRAILINGSTOP]: {
    orderTypeKeyShort: STRING_KEYS.TRAILING_STOP,
    orderTypeKey: STRING_KEYS.TRAILING_STOP,
    descriptionKey: STRING_KEYS.TRAILING_STOP_DESCRIPTION,
  },
};

export const GOOD_TIL_TIME_TIMESCALE_STRINGS: Record<TimeUnitShort, string> = {
  [TimeUnitShort.Minutes]: STRING_KEYS.MINUTES_SHORT,
  [TimeUnitShort.Hours]: STRING_KEYS.HOURS,
  [TimeUnitShort.Days]: STRING_KEYS.DAYS,
  [TimeUnitShort.Weeks]: STRING_KEYS.WEEKS,
};

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

export enum DisplayUnit {
  Asset = 'asset',
  Fiat = 'fiat',
}

export enum PlaceOrderStatuses {
  Submitted = 0,
  Placed = 1,
  // filled here means fully filled. Partial fills will be placed until the expire then Canceled.
  Filled = 2,
  Canceled = 3,
  FailedSubmission = 4,
}

export enum CancelOrderStatuses {
  Submitted = 0,
  Canceled = 1,
  Failed = 2,
}

export type LocalPlaceOrderData = {
  clientId: string;
  orderId?: string;
  submissionStatus: PlaceOrderStatuses;
  errorParams?: ErrorParams;
  submittedThroughCloseAll?: boolean;

  // short term orders may disappear to we cache some last seen data
  cachedData: {
    marketId: string;
    orderType: ClientOrderType;
    subaccountNumber: number;
    status?: OrderStatus;
  };
};

export type LocalCancelOrderData = {
  operationUuid: string;
  orderId: string;
  submissionStatus: CancelOrderStatuses;
  errorParams?: ErrorParams;
  isSubmittedThroughCancelAll?: boolean;

  // short term orders may effectively disappear so let's store everything we need to show the notification
  cachedData: {
    marketId: string;
    orderType: IndexerOrderType;
    displayableId: string;
  };
};

export const CANCEL_ALL_ORDERS_KEY = 'all';
export type LocalCancelAllData = {
  operationUuid: string;
  // market id or 'all'
  filterKey: string;
  cancelOrderOperationUuids: string[];
};

export type LocalCloseAllPositionsData = {
  operationUuid: string;
  clientIds: string[];
};

export enum SimpleUiTradeDialogSteps {
  Edit,
  Submit,
  Confirm,
  Error,
}

export const QUICK_LIMIT_OPTIONS = ['1', '2', '5', '10', '0'] as const;
export type QuickLimitOption = (typeof QUICK_LIMIT_OPTIONS)[number];
