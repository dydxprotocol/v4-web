import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import assign from 'lodash/assign';

import {
  type ClosePositionInputs,
  type InputError,
  type Inputs,
  type TradeInputs,
  type TransferInputs,
} from '@/constants/abacus';
import {
  CLEARED_CLOSE_POSITION_INPUTS,
  CLEARED_SIZE_INPUTS,
  CLEARED_TRADE_INPUTS,
} from '@/constants/trade';

import { safeAssign } from '@/lib/objectHelpers';
import { Nullable } from '@/lib/typeUtils';

type TradeFormInputs = typeof CLEARED_TRADE_INPUTS & typeof CLEARED_SIZE_INPUTS;
type ClosePositionFormInputs = typeof CLEARED_CLOSE_POSITION_INPUTS;

export interface InputsState {
  current?: Nullable<string>;
  inputErrors?: Nullable<InputError[]>;
  tradeFormInputs: TradeFormInputs;
  tradeInputs?: Nullable<TradeInputs>;
  closePositionFormInputs: ClosePositionFormInputs;
  closePositionInputs?: Nullable<ClosePositionInputs>;
  transferInputs?: Nullable<TransferInputs>;
}

const initialState: InputsState = {
  current: undefined,
  inputErrors: undefined,
  tradeFormInputs: {
    ...CLEARED_TRADE_INPUTS,
    ...CLEARED_SIZE_INPUTS,
  },
  closePositionFormInputs: {
    ...CLEARED_CLOSE_POSITION_INPUTS,
  },
  tradeInputs: undefined,
  transferInputs: undefined,
};

export const inputsSlice = createSlice({
  name: 'Inputs',
  initialState,
  reducers: {
    setInputs: (state, action: PayloadAction<Nullable<Inputs>>) => {
      const {
        current,
        errors,
        trade,
        closePosition,
        transfer,
        triggerOrders,
        adjustIsolatedMargin,
      } = action.payload ?? {};

      return {
        ...state,
        current: current?.rawValue,
        inputErrors: errors?.toArray(),
        tradeInputs: trade,
        closePositionInputs: closePosition,
        adjustIsolatedMarginInputs: adjustIsolatedMargin,
        transferInputs: safeAssign({}, transfer, {
          isCctp: !!transfer?.isCctp,
        }),
        triggerOrdersInputs: triggerOrders,
      };
    },

    setTradeFormInputs: (state, action: PayloadAction<Partial<TradeFormInputs>>) => {
      state.tradeFormInputs = assign({}, state.tradeFormInputs, action.payload);
    },
    setClosePositionFormInputs: (
      state,
      action: PayloadAction<Partial<ClosePositionFormInputs>>
    ) => {
      state.closePositionFormInputs = assign({}, state.closePositionFormInputs, action.payload);
    },
  },
});

export const { setInputs, setTradeFormInputs, setClosePositionFormInputs } = inputsSlice.actions;
