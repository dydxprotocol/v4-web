import { createVanillaReducer } from '../../lib/forms';
import { DEFAULT_TRADE_TYPE } from './fields';
import {
  ExecutionType,
  MarginMode,
  OrderSide,
  OrderSizeInputs,
  TimeInForce,
  TimeUnit,
  TradeForm,
  TradeFormType,
} from './types';

const getMinimumRequiredFields = (
  type: TradeFormType = DEFAULT_TRADE_TYPE,
  marketId?: string
): TradeForm => {
  // Base form only includes type
  const baseForm: TradeForm = {
    type,
    execution: undefined,
    goodTil: undefined,
    limitPrice: undefined,
    marginMode: undefined,
    marketId: undefined,
    postOnly: undefined,
    reduceOnly: undefined,
    side: undefined,
    size: undefined,
    targetLeverage: undefined,
    timeInForce: undefined,
    triggerPrice: undefined,
  };

  // Add marketId if provided
  if (marketId) {
    baseForm.marketId = marketId;
  }

  return baseForm;
};

export const tradeFormReducer = createVanillaReducer({
  initialState: getMinimumRequiredFields(),
  actions: {
    // Initialize order form
    initializeForm: (
      state,
      { marketId, orderType }: { orderType: TradeFormType; marketId: string | undefined }
    ) => getMinimumRequiredFields(orderType, marketId),

    // Basic order properties
    setOrderType: (state, type: TradeFormType) => {
      const newState = getMinimumRequiredFields(type, state.marketId);

      // Preserve size, marginMode, side and reduceOnly when changing order types
      return {
        ...newState,
        size: state.size,
        marginMode: state.marginMode,
        side: state.side,
        reduceOnly: state.reduceOnly,
      };
    },

    setMarketId: (state, marketId: string | undefined) => {
      // Reset the form when changing market ID
      return getMinimumRequiredFields(state.type, marketId);
    },

    setSide: (state, side: OrderSide) => ({
      ...state,
      side,
      size:
        state.size != null &&
        // if it's a normal text input, it's safe to keep
        (OrderSizeInputs.is.SIZE(state.size) || OrderSizeInputs.is.USDC_SIZE(state.size))
          ? state.size
          : undefined,
    }),

    setMarginMode: (state, marginMode: MarginMode) => ({
      ...state,
      marginMode,
    }),

    // Size related actions
    setSizeToken: (state, value: string) => ({
      ...state,
      size: OrderSizeInputs.SIZE({ value }),
    }),

    setSizeUsd: (state, value: string) => ({
      ...state,
      size: OrderSizeInputs.USDC_SIZE({ value }),
    }),

    setSizeAvailablePercent: (state, value: string) => ({
      ...state,
      size: OrderSizeInputs.AVAILABLE_PERCENT({ value }),
    }),

    setSizeLeverageSigned: (state, value: string) => ({
      ...state,
      size: OrderSizeInputs.SIGNED_POSITION_LEVERAGE({ value }),
    }),

    // Price related actions
    setLimitPrice: (state, limitPrice: string) => ({
      ...state,
      limitPrice,
    }),

    setTriggerPrice: (state, triggerPrice: string) => ({
      ...state,
      triggerPrice,
    }),

    // Order execution properties
    setReduceOnly: (state, reduceOnly: boolean) => ({
      ...state,
      reduceOnly,
    }),

    setPostOnly: (state, postOnly: boolean) => ({
      ...state,
      postOnly,
    }),

    setTimeInForce: (state, timeInForce: TimeInForce) => ({
      ...state,
      timeInForce,
    }),

    setExecution: (state, execution: ExecutionType) => ({
      ...state,
      execution,
    }),

    setGoodTilTime: (state, goodTil: { duration: string; unit: TimeUnit }) => ({
      ...state,
      goodTil,
    }),

    setTargetLeverage: (state, targetLeverage: string) => ({
      ...state,
      targetLeverage,
    }),

    reset: (state, keepSize?: boolean) => {
      if (!keepSize) {
        return getMinimumRequiredFields(state.type, state.marketId);
      }
      const size = state.size;
      return { ...getMinimumRequiredFields(state.type, state.marketId), size };
    },
  },
});
