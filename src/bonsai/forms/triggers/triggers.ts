import { createForm, createVanillaReducer } from '@/bonsai/lib/forms';
import { PositionUniqueId } from '@/bonsai/types/summaryTypes';

import { getErrors } from './errors';
import { calculateSummary } from './summary';
import { TriggerOrdersFormState, TriggerPriceInputType } from './types';

export const initialState: TriggerOrdersFormState = {
  positionId: undefined,
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
    setPositionId: (state, positionId: PositionUniqueId | undefined) => ({
      ...initialState,
      positionId,
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
        priceInput: initialState.stopLossOrder.priceInput,
        limitPrice: initialState.stopLossOrder.limitPrice,
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
        priceInput: null,
      },
    }),

    // Take Profit actions
    setTakeProfitOrderId: (state, orderId: string | undefined) => ({
      ...state,
      takeProfitOrder: {
        priceInput: initialState.takeProfitOrder.priceInput,
        limitPrice: initialState.takeProfitOrder.limitPrice,
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
        priceInput: null,
      },
    }),

    initializeForm: (state, positionId: PositionUniqueId | undefined) => ({
      ...initialState,
      positionId,
    }),

    reset: () => initialState,
  },
});

export const TriggerOrdersFormFns = createForm({
  reducer,
  calculateSummary,
  getErrors,
});
