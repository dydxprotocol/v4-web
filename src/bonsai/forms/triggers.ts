import {
  OrderExecution,
  OrderFlags,
  OrderSide,
  OrderTimeInForce,
  OrderType,
} from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';

import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { assertNever } from '@/lib/assertNever';
import { calc } from '@/lib/do';
import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';

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

function calculateSummary(state: TriggerOrdersFormState, inputData: InputData): SummaryData {}

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

function calculateTriggerOrderDetails(
  triggerOrder: TriggerOrderState,
  isStopLoss: boolean,
  position: SubaccountPosition | undefined,
  market: MarketInfo | undefined,
  existingTriggerOrders?: SubaccountOrder[],
  useCustomSize?: boolean,
  customSize?: string,
  showLimits?: boolean
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
  if (triggerOrder.priceInput == null) {
    if (triggerOrder.orderId) {
      const existingOrder = existingTriggerOrders?.find(
        (order) => order.id === triggerOrder.orderId
      );

      if (existingOrder) {
        const triggerPrice = existingOrder.triggerPrice;
        // We could calculate other fields based on the trigger price
        if (triggerPrice != null && triggerPrice.isFinite() && triggerPrice.gt(0)) {
          details = { ...details, ...calculateDerivedValues(triggerPrice, isStopLoss) };
        }
      }
    }
    return details;
  }

  // Process based on input type
  switch (triggerOrder.priceInput.type) {
    case TriggerPriceInputType.TriggerPrice: {
      const triggerPrice = parseFloat(triggerOrder.priceInput.triggerPrice);
      if (isNaN(triggerPrice)) return details;

      details.triggerPrice = triggerPrice.toString();

      // Calculate derived values (usdcDiff and percentDiff)
      const size = parseFloat(details.size || '0');
      calculateDerivedValues(
        details,
        triggerPrice,
        size,
        positionSide,
        entryPrice,
        positionNotional,
        scaledLeverage,
        isStopLoss
      );
      break;
    }

    case TriggerPriceInputType.UsdcDiff: {
      const usdcDiff = parseFloat(triggerOrder.priceInput.usdcDiff);
      if (isNaN(usdcDiff)) return details;

      details.usdcDiff = usdcDiff.toString();

      // Calculate triggerPrice
      const size = parseFloat(details.size || '0');
      if (size > 0) {
        const triggerPrice = calculateTriggerPriceFromUsdcDiff(
          usdcDiff,
          size,
          positionSide,
          entryPrice,
          isStopLoss
        );

        if (triggerPrice !== null) {
          details.triggerPrice = triggerPrice.toString();

          // Calculate percentDiff
          if (positionNotional > 0) {
            details.percentDiff = ((usdcDiff / positionNotional) * scaledLeverage * 100).toString();
          }
        }
      }
      break;
    }

    case TriggerPriceInputType.PercentDiff: {
      const percentDiff = parseFloat(triggerOrder.priceInput.percentDiff);
      if (isNaN(percentDiff)) return details;

      details.percentDiff = percentDiff.toString();

      // Calculate usdcDiff
      if (positionNotional > 0) {
        details.usdcDiff = ((percentDiff * positionNotional) / scaledLeverage / 100).toString();
      }

      // Calculate triggerPrice
      const size = parseFloat(details.size || '0');
      if (size > 0 && positionNotional > 0) {
        const triggerPrice = calculateTriggerPriceFromPercentDiff(
          percentDiff,
          size,
          positionSide,
          entryPrice,
          positionNotional,
          scaledLeverage,
          isStopLoss
        );

        if (triggerPrice !== null) {
          details.triggerPrice = triggerPrice.toString();
        }
      }
      break;
    }
  }

  return details;
}

function calculateTriggerPriceValues(
  triggerPrice: BigNumber,
  size: BigNumber,
  position: SubaccountPosition,
  isStopLoss: boolean
): Omit<TriggerOrderDetails, 'size' | 'limitPrice'> {
  const entryPrice = position.baseEntryPrice;
  const positionSide = position.side;
  const positionNotional = position.notional;
  const leverage = position.leverage ?? BIG_NUMBERS.ONE;
  const scaledLeverage = BigNumber.max(leverage.abs(), BIG_NUMBERS.ONE);

  return {
    triggerPrice: triggerPrice.toString(),

    percentDiff: calc(() => {
      if (!positionNotional.isGreaterThan(0)) return undefined;

      if (isStopLoss) {
        if (positionSide === IndexerPositionSide.LONG) {
          return size
            .times(scaledLeverage)
            .times(entryPrice.minus(triggerPrice))
            .div(positionNotional)
            .toString();
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (positionSide === IndexerPositionSide.SHORT) {
          return size
            .times(scaledLeverage)
            .times(triggerPrice.minus(entryPrice))
            .div(positionNotional)
            .toString();
        }
        assertNever(positionSide);
        return undefined;
      }

      // take profit order
      if (positionSide === IndexerPositionSide.LONG) {
        return size
          .times(scaledLeverage)
          .times(triggerPrice.minus(entryPrice))
          .div(positionNotional)
          .toString();
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (positionSide === IndexerPositionSide.SHORT) {
        return size
          .times(scaledLeverage)
          .times(entryPrice.minus(triggerPrice))
          .div(positionNotional)
          .toString();
      }
      assertNever(positionSide);
      return undefined;
    }),

    usdcDiff: calc(() => {
      if (isStopLoss) {
        if (positionSide === IndexerPositionSide.LONG) {
          return size.times(entryPrice.minus(triggerPrice)).toString();
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (positionSide === IndexerPositionSide.SHORT) {
          return size.times(triggerPrice.minus(entryPrice)).toString();
        }
        assertNever(positionSide);
        return undefined;
      }

      // take profit order
      if (positionSide === IndexerPositionSide.LONG) {
        return size.times(triggerPrice.minus(entryPrice)).toString();
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (positionSide === IndexerPositionSide.SHORT) {
        return size.times(entryPrice.minus(triggerPrice)).toString();
      }
      assertNever(positionSide);
      return undefined;
    }),
  };
}

/**
 * Calculate trigger price from USD difference
 */
function calculateTriggerPriceFromUsdcDiff(
  usdcDiff: number,
  size: number,
  positionSide: string,
  entryPrice: number,
  isStopLoss: boolean
): number | null {
  if (size <= 0) return null;

  if (isStopLoss) {
    if (positionSide === 'LONG') {
      return entryPrice - usdcDiff / size;
    }
    if (positionSide === 'SHORT') {
      return entryPrice + usdcDiff / size;
    }
  } else {
    // take profit
    if (positionSide === 'LONG') {
      return entryPrice + usdcDiff / size;
    }
    if (positionSide === 'SHORT') {
      return entryPrice - usdcDiff / size;
    }
  }

  return null;
}

/**
 * Calculate trigger price from percent difference
 */
function calculateTriggerPriceFromPercentDiff(
  percentDiff: number,
  size: number,
  positionSide: string,
  entryPrice: number,
  positionNotional: number,
  scaledLeverage: number,
  isStopLoss: boolean
): number | null {
  if (size <= 0 || positionNotional <= 0) return null;

  const percentDecimal = percentDiff / 100;

  if (isStopLoss) {
    if (positionSide === 'LONG') {
      return entryPrice - (percentDecimal * positionNotional) / (scaledLeverage * size);
    } else if (positionSide === 'SHORT') {
      return entryPrice + (percentDecimal * positionNotional) / (scaledLeverage * size);
    }
  } else {
    // take profit
    if (positionSide === 'LONG') {
      return entryPrice + (percentDecimal * positionNotional) / (scaledLeverage * size);
    } else if (positionSide === 'SHORT') {
      return entryPrice - (percentDecimal * positionNotional) / (scaledLeverage * size);
    }
  }

  return null;
}

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
