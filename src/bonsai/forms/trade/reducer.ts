import { createVanillaReducer } from '../../lib/forms';
import {
  ClosePositionSizeInputs,
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
  type: TradeFormType = TradeFormType.LIMIT,
  marketId?: string,
  positionId?: string
): TradeForm => {
  // Base form only includes type
  const baseForm: TradeForm = { type };

  // Add marketId if provided
  if (type !== TradeFormType.CLOSE_POSITION && marketId) {
    baseForm.marketId = marketId;
  }

  // Add positionId if provided and order type is CLOSE_POSITION
  if (type === TradeFormType.CLOSE_POSITION && positionId) {
    baseForm.positionId = positionId;
  }

  return baseForm;
};

export const tradeFormReducer = createVanillaReducer({
  initialState: getMinimumRequiredFields(),
  actions: {
    // Initialize order form
    initializeForm: (
      state,
      {
        marketId,
        orderType,
        positionId,
      }: { orderType: TradeFormType; marketId: string | undefined; positionId: string | undefined }
    ) => getMinimumRequiredFields(orderType, marketId, positionId),

    // Basic order properties
    setOrderType: (state, type: TradeFormType) => {
      const newState = getMinimumRequiredFields(type, state.marketId, state.positionId);

      // If the new type is CLOSE_POSITION, just use the defaults
      if (type === TradeFormType.CLOSE_POSITION) {
        return newState;
      }

      // Preserve size, marginMode, side and reduceOnly when changing order types
      return {
        ...newState,
        size: state.size,
        marginMode: state.marginMode,
        side: state.side,
        reduceOnly: state.reduceOnly,
      };
    },

    setMarketId: (state, marketId: string) => {
      // Reset the form when changing market ID
      return getMinimumRequiredFields(state.type, marketId, state.positionId);
    },

    setSide: (state, side: OrderSide) => ({
      ...state,
      side,
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

    setSizeLeverage: (state, value: string) => ({
      ...state,
      size: OrderSizeInputs.LEVERAGE({ value }),
    }),

    setSizeBalancePercent: (state, value: string) => ({
      ...state,
      size: OrderSizeInputs.BALANCE_PERCENT({ value }),
    }),

    // Close position size actions
    setClosePositionPositionId: (state, positionId: string) => {
      // Reset the form when changing position ID
      return getMinimumRequiredFields(state.type, state.marketId, positionId);
    },

    setClosePositionSizeToken: (state, value: string) => ({
      ...state,
      closeSize: ClosePositionSizeInputs.SIZE({ value }),
    }),

    setClosePositionSizePercent: (state, value: string) => ({
      ...state,
      closeSize: ClosePositionSizeInputs.POSITION_PERCENT({ value }),
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

    reset: (state) => getMinimumRequiredFields(state.type, state.marketId, state.positionId),
  },
});
