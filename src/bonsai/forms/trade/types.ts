import { OrderbookProcessedData } from '@/bonsai/types/orderbookTypes';
import { MarketsData, ParentSubaccountDataBase } from '@/bonsai/types/rawTypes';
import {
  EquityTiersSummary,
  FeeTierSummary,
  GroupedSubaccountSummary,
  PerpetualMarketSummary,
  RewardParamsSummary,
  SubaccountOrder,
  SubaccountPosition,
  SubaccountSummary,
  UserStats,
} from '@/bonsai/types/summaryTypes';
import unionize, { ofType, UnionOf } from 'unionize';

import { RecordValueType } from '@/lib/typeUtils';

import {
  PlaceOrderPayload,
  TriggerOrderActions,
  TriggerOrderDetails,
  TriggerOrderState,
} from '../triggers/types';

export enum TimeUnit {
  MINUTE = 'M',
  HOUR = 'H',
  DAY = 'D',
  WEEK = 'W',
}

export enum ExecutionType {
  GOOD_TIL_DATE = 'GOOD_TIL_DATE',
  IOC = 'IOC',
  POST_ONLY = 'POST_ONLY',
}

export enum TimeInForce {
  GTT = 'GTT',
  IOC = 'IOC',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum MarginMode {
  CROSS = 'CROSS',
  ISOLATED = 'ISOLATED',
}

export type GoodUntilTime = {
  duration: string;
  unit: TimeUnit;
};

type SizeInput = { value: string };
type UsdcSizeInput = { value: string };
type AvailablePercentInput = { value: string };
type SignedLeverageInput = { value: string };

export const OrderSizeInputs = unionize(
  {
    SIZE: ofType<SizeInput>(),
    USDC_SIZE: ofType<UsdcSizeInput>(),
    AVAILABLE_PERCENT: ofType<AvailablePercentInput>(),
    SIGNED_POSITION_LEVERAGE: ofType<SignedLeverageInput>(),
  },
  { tag: 'type' as const, value: 'value' as const }
);
export type OrderSizeInput = UnionOf<typeof OrderSizeInputs>;

export enum TradeFormType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  TRIGGER_MARKET = 'TRIGGER_MARKET',
  TRIGGER_LIMIT = 'TRIGGER_LIMIT',
}

type OrderMatcher<T> = {
  [K in TradeFormType]: () => T;
};

export function matchOrderType<T>(type: TradeFormType, matcher: OrderMatcher<T>): T {
  const handler = matcher[type];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (handler) {
    return handler();
  }

  throw new Error(`No handler found for order type ${type} and no default handler provided`);
}

// Simplified order form with a single type and optional fields
export type TradeForm = {
  type: TradeFormType;

  // Common fields for standard orders
  marketId: string | undefined;
  side: OrderSide | undefined;

  size: OrderSizeInput | undefined; // Using the proper union type for sizes
  reduceOnly: boolean | undefined;

  // isolated
  marginMode: MarginMode | undefined;
  targetLeverage: string | undefined;

  // Limit order fields
  limitPrice: string | undefined;
  postOnly: boolean | undefined;
  timeInForce: TimeInForce | undefined;

  // Conditional order fields
  triggerPrice: string | undefined;
  execution: ExecutionType | undefined;

  // Time-related fields
  goodTil: GoodUntilTime | undefined;

  // additional triggers
  stopLossOrder: TriggerOrderState | undefined;
  takeProfitOrder: TriggerOrderState | undefined;
};

// Define the FieldState type with conditional properties
export type FieldState<T> = {
  rawValue: T;
  effectiveValue: T | undefined;
  // disabled means it's relevant but can't currently be edited
  state: 'irrelevant' | 'disabled' | 'enabled';
};

// Type for the transformed form with field states
export type TradeFormFieldStates = {
  [K in keyof TradeForm]: FieldState<TradeForm[K]>;
};

export type SelectionOption<T extends string> = {
  value: T;
  stringKey: string;
};
export type TradeFormOptions = {
  orderTypeOptions: SelectionOption<TradeFormType>[];
  executionOptions: SelectionOption<ExecutionType>[];
  timeInForceOptions: SelectionOption<TimeInForce>[];
  goodTilUnitOptions: SelectionOption<TimeUnit>[];

  showLeverage: boolean;
  showAmountClose: boolean;

  showTriggerOrders: boolean;
  triggerOrdersChecked: boolean;

  // these mean the field is relevant to the trade and trade payload in any way (potentially)
  needsSize: boolean;
  needsReduceOnly: boolean;
  needsMarginMode: boolean;
  needsTargetLeverage: boolean;
  needsLimitPrice: boolean;
  needsPostOnly: boolean;
  needsTimeInForce: boolean;
  needsTriggerPrice: boolean;
  needsExecution: boolean;
  needsGoodTil: boolean;

  // these mean show + allow editing this field
  showSize: boolean;
  showReduceOnly: boolean;
  showMarginMode: boolean;
  showTargetLeverage: boolean;
  showLimitPrice: boolean;
  showPostOnly: boolean;
  showTimeInForce: boolean;
  showTriggerPrice: boolean;
  showExecution: boolean;
  showGoodTil: boolean;

  showReduceOnlyTooltip: boolean;
  showPostOnlyTooltip: boolean;
};

export type TradeSizeSummary = {
  size: number | undefined;
  usdcSize: number | undefined;
  leverageSigned: number | undefined;
};

export type TradeInputSummary = {
  size: TradeSizeSummary | undefined;
  averageFillPrice: number | undefined;
  worstFillPrice: number | undefined;
};

export type TradeTriggersSummary = {
  stopLossOrder: TriggerOrderDetails | undefined;
  takeProfitOrder: TriggerOrderDetails | undefined;
};

export type TradeSummary = {
  inputSummary: TradeInputSummary;

  subaccountNumber: number;
  transferToSubaccountAmount: number;
  payloadPrice: number | undefined;

  // minimum is essentially the current position leverage or zero
  minimumSignedLeverage: number;
  // maximum is how far the current order side can push leverage
  maximumSignedLeverage: number;

  slippage: number | undefined;
  fee: number | undefined;
  total: number | undefined;
  reward: number | undefined;
  filled: boolean;
  feeRate: number | undefined;

  // if this trade is effectively closing the position, for simulation purposes
  isPositionClosed: boolean;

  // only for market orders
  indexSlippage: number | undefined;
};

export type TradeFormPayload = {
  orderPayload: PlaceOrderPayload | undefined;
  triggersPayloads: TriggerOrderActions[] | undefined;
};

export type TradeFormSummary = {
  effectiveTrade: TradeForm;
  options: TradeFormOptions;

  tradeInfo: TradeSummary;
  triggersSummary: TradeTriggersSummary | undefined;
  tradePayload: TradeFormPayload | undefined;

  accountDetailsBefore: TradeAccountDetails | undefined;
  accountDetailsAfter: TradeAccountDetails | undefined;
};

export type TradeFormInputData = {
  rawParentSubaccountData: ParentSubaccountDataBase | undefined;
  rawRelevantMarkets: MarketsData | undefined;

  currentTradeMarketOpenOrders: SubaccountOrder[]; // todo remove maybe
  allOpenOrders: SubaccountOrder[];
  userFeeStats: UserStats;

  currentTradeMarket: RecordValueType<MarketsData> | undefined;
  currentTradeMarketSummary: PerpetualMarketSummary | undefined;
  currentTradeMarketOrderbook: OrderbookProcessedData | undefined;
  feeTiers: FeeTierSummary[] | undefined;
  rewardParams: RewardParamsSummary;
  equityTiers: EquityTiersSummary | undefined;
};

export type TradeAccountDetails = {
  account?: GroupedSubaccountSummary;
  position?: SubaccountPosition;
  subaccountSummaries?: { [subaccountNumber: string]: SubaccountSummary | undefined };
};
