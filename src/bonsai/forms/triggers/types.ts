import {
  MarketInfo,
  PositionUniqueId,
  SubaccountOrder,
  SubaccountPosition,
} from '@/bonsai/types/summaryTypes';
import {
  OrderExecution,
  OrderFlags,
  OrderSide,
  OrderTimeInForce,
  OrderType,
} from '@dydxprotocol/v4-client-js';

export interface TriggerOrdersFormState {
  positionId?: PositionUniqueId;
  size: {
    checked: boolean;
    size: string;
  };
  showLimits: boolean;

  stopLossOrder: TriggerOrderState;
  takeProfitOrder: TriggerOrderState;
}

export interface TriggerOrderState {
  // if provided, we are modifying an order so priceInput will populate with order details if undefined
  orderId?: string;

  // ignored if showLimits is false
  limitPrice?: string;

  // if undefined, try using existing order details, otherwise empty inputs
  priceInput?:
    | null // null means delete
    | { type: TriggerPriceInputType.TriggerPrice; triggerPrice: string }
    | { type: TriggerPriceInputType.PercentDiff; percentDiff: string }
    | { type: TriggerPriceInputType.UsdcDiff; usdcDiff: string };
}

export enum TriggerPriceInputType {
  TriggerPrice = 'TRIGGER_PRICE',
  PercentDiff = 'PERCENT_DIFF',
  UsdcDiff = 'USDC_DIFF',
}

export interface TriggerOrderInputData {
  position?: SubaccountPosition;
  market?: MarketInfo;
  existingTriggerOrders?: SubaccountOrder[];
}

export interface TriggerOrdersPayload {
  placeOrderPayloads: PlaceOrderPayload[];
  cancelOrderPayloads: CancelOrderPayload[];
}

export interface TriggerOrderDetails {
  triggerPrice?: string;
  limitPrice?: string;
  percentDiff?: string;
  usdcDiff?: string;
  size?: string;
}

export interface SummaryData {
  effectiveEntryMargin?: number;
  stopLossOrder: TriggerOrderDetails;
  takeProfitOrder: TriggerOrderDetails;
  payload: TriggerOrdersPayload | undefined;
}

// todo move this to somewhere central
export interface CancelOrderPayload {
  subaccountNumber: number;
  orderId: string;
  clientId: number;
  orderFlags: OrderFlags;
  clobPairId: number;
  goodTilBlock?: number;
  goodTilBlockTime?: number;
}

export interface PlaceOrderPayload {
  subaccountNumber: number;
  marketId: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  size: number;
  clientId: number;
  timeInForce?: OrderTimeInForce;
  goodTilTimeInSeconds?: number;
  execution?: OrderExecution;
  postOnly?: boolean;
  reduceOnly?: boolean;
  triggerPrice?: number;
  marketInfo?: PlaceOrderMarketInfo;
  currentHeight?: number;
  goodTilBlock?: number;
  memo?: string;
}

// have to hard code because it isn't properly exported from v4-clients
export interface PlaceOrderMarketInfo {
  clobPairId: number;
  atomicResolution: number;
  stepBaseQuantums: number;
  quantumConversionExponent: number;
  subticksPerTick: number;
}
