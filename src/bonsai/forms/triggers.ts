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
import { calc, mapIfPresent } from '@/lib/do';
import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';

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
    getPositionEffectiveEntryMargin
  )?.toNumber();
  const stopLossOrder = calculateTriggerOrderDetails(state.stopLossOrder, true, state, inputData);
  const takeProfitOrder = calculateTriggerOrderDetails(
    state.takeProfitOrder,
    false,
    state,
    inputData
  );
  return { effectiveEntryMargin, stopLossOrder, takeProfitOrder };
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

export function calculateTriggerOrderDetails(
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

export function calculateTriggerPriceValues(
  triggerPrice: BigNumber,
  unsignedSize: BigNumber,
  position: SubaccountPosition,
  isStopLoss: boolean
): Omit<TriggerOrderDetails, 'size' | 'limitPrice'> {
  const entryPrice = position.baseEntryPrice;
  const positionSide = position.side;

  const effectiveEntryMargin = unsignedSize
    .div(position.unsignedSize)
    .times(getPositionEffectiveEntryMargin(position));

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

export function calculateTriggerPriceFromUsdcDiff(
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

export function calculateTriggerPriceFromPercentDiff(
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
    .times(getPositionEffectiveEntryMargin(position))
    .times(percentDiff);

  return calculateTriggerPriceFromUsdcDiff(priceDiff, size, position, isStopLoss);
}

// so i can switch easily, temp
const getPositionEffectiveEntryMargin = getPositionBaseEquity;

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
