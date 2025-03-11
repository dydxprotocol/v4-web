import unionize, { ofType, UnionOf } from 'unionize';

export enum TimeUnit {
  MINUTE = 'M',
  HOUR = 'H',
  DAY = 'D',
  WEEK = 'W',
}

export enum ExecutionType {
  DEFAULT = 'DEFAULT',
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
type LeverageInput = { value: string };
type BalancePercentInput = { value: string };
type PositionSizeInput = { value: string };
type PositionPercentInput = { value: string };

export const OrderSizeInputs = unionize(
  {
    SIZE: ofType<SizeInput>(),
    USDC_SIZE: ofType<UsdcSizeInput>(),
    LEVERAGE: ofType<LeverageInput>(),
    BALANCE_PERCENT: ofType<BalancePercentInput>(),
  },
  { tag: 'type' as const, value: 'value' as const }
);
export type OrderSizeInput = UnionOf<typeof OrderSizeInputs>;

export const ClosePositionSizeInputs = unionize(
  {
    SIZE: ofType<PositionSizeInput>(),
    POSITION_PERCENT: ofType<PositionPercentInput>(),
  },
  { tag: 'type' as const, value: 'value' as const }
);
export type ClosePositionSizeInput = UnionOf<typeof ClosePositionSizeInputs>;

export enum TradeFormType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP_MARKET = 'STOP_MARKET',
  STOP_LIMIT = 'STOP_LIMIT',
  TAKE_PROFIT_MARKET = 'TAKE_PROFIT_MARKET',
  TAKE_PROFIT_LIMIT = 'TAKE_PROFIT_LIMIT',
  CLOSE_POSITION = 'CLOSE_POSITION',
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
  marketId?: string;
  side?: OrderSide;
  size?: OrderSizeInput; // Using the proper union type for sizes
  reduceOnly?: boolean;

  // isolated
  marginMode?: MarginMode;
  targetLeverage?: string;

  // Limit order fields
  limitPrice?: string;
  postOnly?: boolean;
  timeInForce?: TimeInForce;

  // Conditional order fields
  triggerPrice?: string;
  execution?: ExecutionType;

  // Time-related fields
  goodTil?: GoodUntilTime;

  // Close position fields
  positionId?: string;
  closeSize?: ClosePositionSizeInput; // Using the proper union type for close position sizes
};

// Define the FieldState type with conditional properties
export type FieldState<T> =
  | {
      visible: true;
      rawValue: T | undefined;
      renderedValue: NonNullable<T>;
      required: boolean;
      disabled: boolean;
    }
  | { visible: false; rawValue: T | undefined; renderedValue: T | undefined };

// Type for the transformed form with field states
export type TradeFormFieldStates = {
  [K in keyof TradeForm]: FieldState<TradeForm[K]>;
};

export type TradeFormOptions = {
  maximumLeverage: number;

  orderTypeOptions: string[];
  executionOptions: string[];
  timeInForceOptions: string[];
  goodTilUnitOptions: string[];
};

export type TradeFormSummary = {
  fieldStates: TradeFormFieldStates;
  options: TradeFormOptions;
  payload: TradePayload;
  tradeInfo: TradeInfo;
  accountBefore: TradeAccount;
  accountAfter: TradeAccount;
  positionBefore: TradePosition;
  positionAfter: TradePosition;
};
