import {
  OrderExecution,
  OrderFlags,
  OrderSide,
  OrderTimeInForce,
  OrderType,
} from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';

import { timeUnits } from '@/constants/time';
import { IndexerOrderType, IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { assertNever } from '@/lib/assertNever';
import { calc, mapIfPresent } from '@/lib/do';
import { AttemptNumber, BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';

import { getPositionBaseEquity } from '../calculators/subaccount';
import { createForm, createVanillaReducer } from '../lib/forms';
import { ValidationError } from '../lib/validationErrors';
import { MarketInfo, SubaccountOrder, SubaccountPosition } from '../types/summaryTypes';

export interface TriggerOrdersFormState {
  marketId?: string;
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
    | { type: TriggerPriceInputType.TriggerPrice; triggerPrice: string }
    | { type: TriggerPriceInputType.PercentDiff; percentDiff: string }
    | { type: TriggerPriceInputType.UsdcDiff; usdcDiff: string };
}

export enum TriggerPriceInputType {
  TriggerPrice = 'TRIGGER_PRICE',
  PercentDiff = 'PERCENT_DIFF',
  UsdcDiff = 'USDC_DIFF',
}

export const initialState: TriggerOrdersFormState = {
  marketId: undefined,
  size: {
    checked: false,
    size: '',
  },
  showLimits: false,
  stopLossOrder: {},
  takeProfitOrder: {},
};

const reducer = createVanillaReducer({
  initialState,
  actions: {
    setMarketId: (state, marketId: string | undefined) => ({
      ...initialState,
      marketId,
    }),

    setSizeChecked: (state, checked: boolean) => ({
      ...state,
      size: {
        ...state.size,
        checked,
      },
    }),

    setSize: (state, size: string) => ({
      ...state,
      size: {
        ...state.size,
        size,
      },
    }),

    setShowLimits: (state, showLimits: boolean) => ({
      ...state,
      showLimits,
    }),

    // Stop Loss actions
    setStopLossOrderId: (state, orderId: string | undefined) => ({
      ...state,
      stopLossOrder: {
        ...state.stopLossOrder,
        orderId,
      },
    }),

    setStopLossLimitPrice: (state, limitPrice: string | undefined) => ({
      ...state,
      stopLossOrder: {
        ...state.stopLossOrder,
        limitPrice,
      },
    }),

    setStopLossTriggerPrice: (state, triggerPrice: string) => ({
      ...state,
      stopLossOrder: {
        ...state.stopLossOrder,
        priceInput: {
          type: TriggerPriceInputType.TriggerPrice,
          triggerPrice,
        },
      },
    }),

    setStopLossPercentDiff: (state, percentDiff: string) => ({
      ...state,
      stopLossOrder: {
        ...state.stopLossOrder,
        priceInput: {
          type: TriggerPriceInputType.PercentDiff,
          percentDiff,
        },
      },
    }),

    setStopLossUsdcDiff: (state, usdcDiff: string) => ({
      ...state,
      stopLossOrder: {
        ...state.stopLossOrder,
        priceInput: {
          type: TriggerPriceInputType.UsdcDiff,
          usdcDiff,
        },
      },
    }),

    clearStopLossPriceInput: (state) => ({
      ...state,
      stopLossOrder: {
        ...state.stopLossOrder,
        priceInput: undefined,
      },
    }),

    // Take Profit actions
    setTakeProfitOrderId: (state, orderId: string | undefined) => ({
      ...state,
      takeProfitOrder: {
        ...state.takeProfitOrder,
        orderId,
      },
    }),

    setTakeProfitLimitPrice: (state, limitPrice: string | undefined) => ({
      ...state,
      takeProfitOrder: {
        ...state.takeProfitOrder,
        limitPrice,
      },
    }),

    setTakeProfitTriggerPrice: (state, triggerPrice: string) => ({
      ...state,
      takeProfitOrder: {
        ...state.takeProfitOrder,
        priceInput: {
          type: TriggerPriceInputType.TriggerPrice,
          triggerPrice,
        },
      },
    }),

    setTakeProfitPercentDiff: (state, percentDiff: string) => ({
      ...state,
      takeProfitOrder: {
        ...state.takeProfitOrder,
        priceInput: {
          type: TriggerPriceInputType.PercentDiff,
          percentDiff,
        },
      },
    }),

    setTakeProfitUsdcDiff: (state, usdcDiff: string) => ({
      ...state,
      takeProfitOrder: {
        ...state.takeProfitOrder,
        priceInput: {
          type: TriggerPriceInputType.UsdcDiff,
          usdcDiff,
        },
      },
    }),

    clearTakeProfitPriceInput: (state) => ({
      ...state,
      takeProfitOrder: {
        ...state.takeProfitOrder,
        priceInput: undefined,
      },
    }),

    initializeForm: (state, marketId: string | undefined) => ({
      ...initialState,
      marketId,
    }),

    reset: () => initialState,
  },
});

interface InputData {
  position?: SubaccountPosition;
  market?: MarketInfo;
  existingTriggerOrders?: SubaccountOrder[];
  canViewAccount?: boolean;
}

interface TriggerOrdersPayload {
  placeOrderPayloads: PlaceOrderPayload[];
  cancelOrderPayloads: CancelOrderPayload[];
}

interface TriggerOrderDetails {
  triggerPrice?: string;
  limitPrice?: string;
  percentDiff?: string;
  usdcDiff?: string;
  size?: string;
}

interface SummaryData {
  effectiveEntryMargin?: number;
  stopLossOrder: TriggerOrderDetails;
  takeProfitOrder: TriggerOrderDetails;
  payload: TriggerOrdersPayload | undefined;
}

function calculateSummary(state: TriggerOrdersFormState, inputData: InputData): SummaryData {
  const effectiveEntryMargin = mapIfPresent(
    inputData.position,
    getEffectiveBaseEquityFn
  )?.toNumber();
  const stopLossOrder = calculateTriggerOrderDetails(state.stopLossOrder, true, state, inputData);
  const takeProfitOrder = calculateTriggerOrderDetails(
    state.takeProfitOrder,
    false,
    state,
    inputData
  );
  const payload = calculateTriggerOrderPayload(stopLossOrder, takeProfitOrder, state, inputData);

  return { effectiveEntryMargin, stopLossOrder, takeProfitOrder, payload };
}

function getErrors(
  state: TriggerOrdersFormState,
  inputData: InputData,
  summary: SummaryData
): ValidationError[] {}

export const TriggerOrdersFormFns = createForm({
  reducer,
  calculateSummary,
  getErrors,
});

function calculateTriggerOrderPayload(
  stopLossOrder: TriggerOrderDetails,
  takeProfitOrder: TriggerOrderDetails,
  state: TriggerOrdersFormState,
  inputData: InputData
): TriggerOrdersPayload | undefined {
  const { position } = inputData;

  // Position is always required to calculate order details
  if (!position) {
    return undefined;
  }

  const placeOrderPayloads: PlaceOrderPayload[] = [];
  const cancelOrderPayloads: CancelOrderPayload[] = [];

  if (
    state.stopLossOrder.orderId != null ||
    state.stopLossOrder.priceInput != null ||
    state.stopLossOrder.limitPrice != null
  ) {
    const actions = getTriggerOrderActions(
      true, // isStopLoss
      state.stopLossOrder,
      stopLossOrder,
      state,
      position,
      inputData
    );

    // If actions is undefined, it means we're missing required data
    if (actions === undefined) {
      return undefined;
    }

    if (actions.cancelPayload) cancelOrderPayloads.push(actions.cancelPayload);
    if (actions.placePayload) placeOrderPayloads.push(actions.placePayload);
  }

  if (
    state.takeProfitOrder.orderId != null ||
    state.takeProfitOrder.priceInput != null ||
    state.takeProfitOrder.limitPrice != null
  ) {
    const actions = getTriggerOrderActions(
      false,
      state.takeProfitOrder,
      takeProfitOrder,
      state,
      position,
      inputData
    );

    // If actions is undefined, it means we're missing required data
    if (actions === undefined) {
      return undefined;
    }

    if (actions.cancelPayload) cancelOrderPayloads.push(actions.cancelPayload);
    if (actions.placePayload) placeOrderPayloads.push(actions.placePayload);
  }

  // Only return a payload if there's at least one action to take
  if (placeOrderPayloads.length === 0 && cancelOrderPayloads.length === 0) {
    return undefined;
  }

  return {
    placeOrderPayloads,
    cancelOrderPayloads,
  };
}

interface TriggerOrderActions {
  cancelPayload?: CancelOrderPayload;
  placePayload?: PlaceOrderPayload;
}

function getTriggerOrderActions(
  isStopLoss: boolean,
  triggerOrderState: TriggerOrderState,
  triggerOrderDetails: TriggerOrderDetails,
  formState: Omit<TriggerOrdersFormState, 'takeProfitOrder' | 'stopLossOrder'>,
  position: SubaccountPosition,
  inputData: InputData
): TriggerOrderActions | undefined {
  const { orderId } = triggerOrderState;
  const { triggerPrice } = triggerOrderDetails;
  const actions: TriggerOrderActions = {};

  // Cases:
  // 1. Existing order -> update (cancel + place)
  // 2. Existing order -> nothing should be done (no changes)
  // 3. Existing order -> should delete (cancel)
  // 4. No existing order -> create a new one (place)
  // 5. No existing order -> nothing should be done (no input)

  if (orderId) {
    // We need existingTriggerOrders when we have an orderId
    const { existingTriggerOrders } = inputData;
    if (!existingTriggerOrders) {
      return undefined; // Missing required data
    }

    const existingOrder = existingTriggerOrders.find((order) => order.id === orderId);
    if (!existingOrder) {
      return undefined; // Missing required data (order doesn't exist)
    }

    if (triggerPrice) {
      // Check if order needs updating
      if (
        !isTriggerOrderEqualToExistingOrder(
          triggerOrderDetails,
          existingOrder,
          formState.showLimits
        )
      ) {
        // Case 1: Existing order -> update
        actions.cancelPayload = createCancelOrderPayload(existingOrder);

        // We need market data to create a new order
        const { market } = inputData;
        if (!market) {
          return undefined; // Missing required data
        }

        actions.placePayload = createPlaceOrderPayload(
          isStopLoss,
          triggerOrderDetails,
          position,
          market,
          formState.showLimits
        );
      }
      // Case 2: Existing order -> no change needed
    } else {
      // Case 3: Existing order -> should delete
      actions.cancelPayload = createCancelOrderPayload(existingOrder);
    }
  } else if (triggerPrice) {
    // Case 4: No existing order -> create new
    // We need market data to create a new order
    const { market } = inputData;
    if (!market) {
      return undefined; // Missing required data
    }

    actions.placePayload = createPlaceOrderPayload(
      isStopLoss,
      triggerOrderDetails,
      position,
      market,
      formState.showLimits
    );
  }

  // Case 5: nothing to do
  return actions;
}

function isTriggerOrderEqualToExistingOrder(
  triggerOrderDetails: TriggerOrderDetails,
  existingOrder: SubaccountOrder,
  showLimits: boolean
): boolean {
  const sizesEqual =
    triggerOrderDetails.size != null &&
    MustBigNumber(triggerOrderDetails.size).eq(existingOrder.size);

  const triggerPricesEqual =
    existingOrder.triggerPrice != null &&
    triggerOrderDetails.triggerPrice != null &&
    MustBigNumber(triggerOrderDetails.triggerPrice).eq(existingOrder.triggerPrice);

  // Only check limit price if using limit orders
  const limitPriceCheck = calc(() => {
    const isExistingLimit =
      existingOrder.type === IndexerOrderType.TAKEPROFIT ||
      existingOrder.type === IndexerOrderType.STOPLIMIT;
    const showingLimits = showLimits;
    if (isExistingLimit) {
      // must be showing limits and equal
      if (!showingLimits) {
        return false;
      }
      return (
        triggerOrderDetails.limitPrice != null &&
        MustBigNumber(triggerOrderDetails.limitPrice).eq(existingOrder.price)
      );
    }
    // must be hiding limits
    return !showingLimits;
  });

  return sizesEqual && triggerPricesEqual && limitPriceCheck;
}

function createCancelOrderPayload(order: SubaccountOrder): CancelOrderPayload | undefined {
  const clientId = AttemptNumber(order.clientId);
  const clobPairId = order.clobPairId;
  if (clientId == null || clobPairId == null) {
    return undefined;
  }

  const orderFlags =
    order.orderFlags === '0'
      ? OrderFlags.SHORT_TERM
      : order.orderFlags === '32'
        ? OrderFlags.CONDITIONAL
        : order.orderFlags === '64'
          ? OrderFlags.LONG_TERM
          : undefined;

  if (orderFlags == null) {
    return undefined;
  }

  return {
    subaccountNumber: order.subaccountNumber,
    orderId: order.id,
    clientId,
    orderFlags,
    clobPairId,
    goodTilBlock: order.goodTilBlock,
    goodTilBlockTime: order.goodTilBlockTime,
  };
}

function createPlaceOrderPayload(
  isStopLoss: boolean,
  orderDetails: TriggerOrderDetails,
  position: SubaccountPosition,
  market: MarketInfo,
  showLimits: boolean
): PlaceOrderPayload | undefined {
  // Parse and validate numeric inputs
  const size = AttemptNumber(orderDetails.size);
  const triggerPrice = AttemptNumber(orderDetails.triggerPrice);

  if (size == null || triggerPrice == null) {
    return undefined;
  }

  // Determine order type and side based on position side and order type
  const positionSide = position.side;
  const side = positionSide === IndexerPositionSide.LONG ? OrderSide.SELL : OrderSide.BUY;

  const orderType = isStopLoss
    ? showLimits
      ? OrderType.STOP_LIMIT
      : OrderType.STOP_MARKET
    : showLimits
      ? OrderType.TAKE_PROFIT_LIMIT
      : OrderType.TAKE_PROFIT_MARKET;

  const maxUnsignedInt = 4294967295;
  const clientId = Math.floor(Math.random() * maxUnsignedInt);
  const goodTilTimeInSeconds = 28 * timeUnits.day; // 28 days

  const clobPairId = AttemptNumber(market.clobPairId);
  if (clobPairId == null) {
    return undefined;
  }
  const marketInfo: PlaceOrderMarketInfo = {
    clobPairId,
    atomicResolution: market.atomicResolution,
    stepBaseQuantums: market.stepBaseQuantums,
    quantumConversionExponent: market.quantumConversionExponent,
    subticksPerTick: market.subticksPerTick,
  };

  const price = getPrice(orderType, side, orderDetails, market.ticker);
  if (price == null) {
    return undefined;
  }

  return {
    subaccountNumber: position.subaccountNumber,
    marketId: position.market,
    type: orderType,
    side,
    price,
    size,
    clientId,
    // TP/SL orders always have null timeInForce. IOC/PostOnly/GTD is distinguished by execution
    timeInForce: undefined,
    execution:
      orderType === OrderType.STOP_MARKET || orderType === OrderType.TAKE_PROFIT_MARKET
        ? OrderExecution.IOC
        : OrderExecution.DEFAULT,
    goodTilTimeInSeconds,
    reduceOnly: true,
    postOnly: false,
    triggerPrice,
    marketInfo,
  };
}

const MAJOR_MARKETS = new Set(['ETH-USD', 'BTC-USD', 'SOL-USD']);
const STOP_MARKET_ORDER_SLIPPAGE_BUFFER_MAJOR_MARKET = 0.05;
const TAKE_PROFIT_MARKET_ORDER_SLIPPAGE_BUFFER_MAJOR_MARKET = 0.05;
const STOP_MARKET_ORDER_SLIPPAGE_BUFFER = 0.1;
const TAKE_PROFIT_MARKET_ORDER_SLIPPAGE_BUFFER = 0.1;
// const MARKET_ORDER_MAX_SLIPPAGE = 0.05;
// const SLIPPAGE_STEP_SIZE = 0.00001;

function getPrice(
  orderType: OrderType,
  side: OrderSide,
  orderDetails: TriggerOrderDetails,
  market: string
): number | undefined {
  const triggerPrice = AttemptNumber(orderDetails.triggerPrice);
  if (triggerPrice == null) {
    return undefined;
  }

  // For market orders, calculate price with slippage based on the trigger price
  if (orderType === OrderType.STOP_MARKET || orderType === OrderType.TAKE_PROFIT_MARKET) {
    const isMajorMarket = MAJOR_MARKETS.has(market);

    // Slippage percentages based on market type and order type
    const slippagePercentage = calc(() => {
      if (isMajorMarket) {
        return orderType === OrderType.STOP_MARKET
          ? STOP_MARKET_ORDER_SLIPPAGE_BUFFER_MAJOR_MARKET
          : TAKE_PROFIT_MARKET_ORDER_SLIPPAGE_BUFFER_MAJOR_MARKET;
      }
      return orderType === OrderType.STOP_MARKET
        ? STOP_MARKET_ORDER_SLIPPAGE_BUFFER
        : TAKE_PROFIT_MARKET_ORDER_SLIPPAGE_BUFFER;
    });

    if (side === OrderSide.BUY) {
      return triggerPrice * (1 + slippagePercentage);
    }
    return triggerPrice * (1 - slippagePercentage);
  }

  // For limit orders, use the limit price
  if (orderType === OrderType.STOP_LIMIT || orderType === OrderType.TAKE_PROFIT_LIMIT) {
    return AttemptNumber(orderDetails.limitPrice);
  }

  return undefined;
}

function calculateTriggerOrderDetails(
  triggerOrder: TriggerOrderState,
  isStopLoss: boolean,
  {
    showLimits,
    size: { checked: useCustomSize, size: customSize },
  }: Omit<TriggerOrdersFormState, 'takeProfitOrder' | 'stopLossOrder'>,
  { position, existingTriggerOrders }: InputData
): TriggerOrderDetails {
  const details: TriggerOrderDetails = {};

  // Can't calculate anything without position
  if (!position) {
    return details;
  }

  // Set the limit price if present and limits are enabled
  const parsedLimitPrice = MustBigNumber(triggerOrder.limitPrice);
  if (showLimits && parsedLimitPrice.isFinite() && parsedLimitPrice.gt(0)) {
    details.limitPrice = triggerOrder.limitPrice?.toString();
  }

  // Calculate and set size
  const parsedCustomSize = MustBigNumber(customSize);
  const size =
    useCustomSize && customSize && parsedCustomSize.isFinite() && parsedCustomSize.gt(0)
      ? parsedCustomSize
      : position.unsignedSize;
  details.size = size.toString();

  // handle no price input
  const priceInput = triggerOrder.priceInput;
  if (priceInput == null) {
    if (triggerOrder.orderId) {
      const existingOrder = existingTriggerOrders?.find(
        (order) => order.id === triggerOrder.orderId
      );

      if (existingOrder) {
        const triggerPrice = existingOrder.triggerPrice;
        // We could calculate other fields based on the trigger price
        if (triggerPrice != null && triggerPrice.isFinite()) {
          return {
            ...details,
            ...calculateTriggerPriceValues(triggerPrice, size, position, isStopLoss),
          };
        }
      }
    }
    return details;
  }

  const newTriggerPrice = calc(() => {
    if (priceInput.type === TriggerPriceInputType.TriggerPrice) {
      return MustBigNumber(priceInput.triggerPrice);
    }
    if (priceInput.type === TriggerPriceInputType.UsdcDiff) {
      return MustBigNumber(
        calculateTriggerPriceFromUsdcDiff(
          MustBigNumber(priceInput.usdcDiff),
          size,
          position,
          isStopLoss
        )
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (priceInput.type === TriggerPriceInputType.PercentDiff) {
      return MustBigNumber(
        calculateTriggerPriceFromPercentDiff(
          MustBigNumber(priceInput.percentDiff),
          size,
          position,
          isStopLoss
        )
      );
    }
    assertNever(priceInput);
    return BIG_NUMBERS.ZERO;
  });

  if (!newTriggerPrice.isFinite()) {
    return details;
  }
  return {
    ...details,
    ...calculateTriggerPriceValues(newTriggerPrice, size, position, isStopLoss),
  };
}

function calculateTriggerPriceValues(
  triggerPrice: BigNumber,
  unsignedSize: BigNumber,
  position: SubaccountPosition,
  isStopLoss: boolean
): Omit<TriggerOrderDetails, 'size' | 'limitPrice'> {
  const entryPrice = position.baseEntryPrice;
  const positionSide = position.side;

  const effectiveEntryMargin = unsignedSize
    .div(position.unsignedSize)
    .times(getEffectiveBaseEquityFn(position));

  return {
    triggerPrice: triggerPrice.toString(),

    percentDiff: calc(() => {
      if (effectiveEntryMargin.isZero() || !effectiveEntryMargin.isFinite()) return undefined;

      if (isStopLoss) {
        if (positionSide === IndexerPositionSide.LONG) {
          return unsignedSize
            .times(entryPrice.minus(triggerPrice))
            .div(effectiveEntryMargin)
            .toString();
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (positionSide === IndexerPositionSide.SHORT) {
          return unsignedSize
            .times(triggerPrice.minus(entryPrice))
            .div(effectiveEntryMargin)
            .toString();
        }
        assertNever(positionSide);
        return undefined;
      }

      // take profit order
      if (positionSide === IndexerPositionSide.LONG) {
        return unsignedSize
          .times(triggerPrice.minus(entryPrice))
          .div(effectiveEntryMargin)
          .toString();
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (positionSide === IndexerPositionSide.SHORT) {
        return unsignedSize
          .times(entryPrice.minus(triggerPrice))
          .div(effectiveEntryMargin)
          .toString();
      }
      assertNever(positionSide);
      return undefined;
    }),

    usdcDiff: calc(() => {
      if (effectiveEntryMargin.isZero() || !effectiveEntryMargin.isFinite()) return undefined;
      if (isStopLoss) {
        if (positionSide === IndexerPositionSide.LONG) {
          return unsignedSize.times(entryPrice.minus(triggerPrice)).toString();
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (positionSide === IndexerPositionSide.SHORT) {
          return unsignedSize.times(triggerPrice.minus(entryPrice)).toString();
        }
        assertNever(positionSide);
        return undefined;
      }

      // take profit order
      if (positionSide === IndexerPositionSide.LONG) {
        return unsignedSize.times(triggerPrice.minus(entryPrice)).toString();
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (positionSide === IndexerPositionSide.SHORT) {
        return unsignedSize.times(entryPrice.minus(triggerPrice)).toString();
      }
      assertNever(positionSide);
      return undefined;
    }),
  };
}

function calculateTriggerPriceFromUsdcDiff(
  usdcDiff: BigNumber,
  size: BigNumber,
  position: SubaccountPosition,
  isStopLoss: boolean
): BigNumber | undefined {
  if (size.lte(0)) {
    return undefined;
  }

  const entryPrice = position.baseEntryPrice;
  const priceDiff = usdcDiff.div(size);

  if (isStopLoss) {
    if (position.side === IndexerPositionSide.LONG) {
      return entryPrice.minus(priceDiff);
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (position.side === IndexerPositionSide.SHORT) {
      return entryPrice.plus(priceDiff);
    }
  }
  // take profit
  if (position.side === IndexerPositionSide.LONG) {
    return entryPrice.plus(priceDiff);
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (position.side === IndexerPositionSide.SHORT) {
    return entryPrice.minus(priceDiff);
  }
  return undefined;
}

function calculateTriggerPriceFromPercentDiff(
  percentDiff: BigNumber,
  size: BigNumber,
  position: SubaccountPosition,
  isStopLoss: boolean
): BigNumber | undefined {
  if (position.unsignedSize.lte(0)) {
    return undefined;
  }

  const priceDiff = size
    .div(position.unsignedSize)
    .times(getEffectiveBaseEquityFn(position))
    .times(percentDiff);

  return calculateTriggerPriceFromUsdcDiff(priceDiff, size, position, isStopLoss);
}

// so we switch easily bewteen possible implementations
const getEffectiveBaseEquityFn = getPositionBaseEquity;

// todo move this to somewhere central
interface CancelOrderPayload {
  subaccountNumber: number;
  orderId: string;
  clientId: number;
  orderFlags: OrderFlags;
  clobPairId: number;
  goodTilBlock?: number;
  goodTilBlockTime?: number;
}

interface PlaceOrderPayload {
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
interface PlaceOrderMarketInfo {
  clobPairId: number;
  atomicResolution: number;
  stepBaseQuantums: number;
  quantumConversionExponent: number;
  subticksPerTick: number;
}
