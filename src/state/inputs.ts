import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
  InputError,
  Inputs,
  Nullable,
  TradeInputs,
  ClosePositionInputs,
  TransferInputs,
} from '@/constants/abacus';

export interface InputsState {
  current?: Nullable<string>;
  inputErrors?: Nullable<InputError[]>;
  tradeInputs?: Nullable<TradeInputs>;
  closePositionInputs?: Nullable<ClosePositionInputs>;
  transferInputs?: Nullable<TransferInputs>;
}

const initialState: InputsState = {
  current: undefined,
  inputErrors: undefined,
  tradeInputs: undefined,
  transferInputs: undefined,
};

export const inputsSlice = createSlice({
  name: 'Inputs',
  initialState,
  reducers: {
    setInputs: (state, action: PayloadAction<Nullable<Inputs>>) => {
      const { current, errors, trade, closePosition, transfer } = action.payload || {};

      return {
        ...state,
        current: current?.rawValue,
        inputErrors: errors?.toArray(),
        tradeInputs: trade,
        closePositionInputs: closePosition,
        transferInputs: transfer,
      };
    },
  },
});

export const { setInputs } = inputsSlice.actions;
