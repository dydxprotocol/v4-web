import { createForm, createVanillaReducer } from '@/bonsai/lib/forms';

import { getErrors } from './errors';
import { calculateSummary } from './summary';
import { TriggerOrdersFormState, TriggerPriceInputType } from './types';

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

export const TriggerOrdersFormFns = createForm({
  reducer,
  calculateSummary,
  getErrors,
});
