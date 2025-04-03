import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  type InputError,
  type Inputs,
  type Nullable,
  type TransferInputs,
} from '@/constants/abacus';

import { safeAssign } from '@/lib/objectHelpers';

export interface InputsState {
  // remove all these when old withdraw form is gone
  current?: Nullable<string>;
  inputErrors?: Nullable<InputError[]>;
  transferInputs?: Nullable<TransferInputs>;

  currentTradePageForm: 'TRADE' | 'CLOSE_POSITION';
}

const initialState: InputsState = {
  current: undefined,
  inputErrors: undefined,
  transferInputs: undefined,
  currentTradePageForm: 'TRADE',
};

export const inputsSlice = createSlice({
  name: 'Inputs',
  initialState,
  reducers: {
    setInputs: (state, action: PayloadAction<Nullable<Inputs>>) => {
      const { current, errors, transfer } = action.payload ?? {};

      return {
        ...state,
        current: current?.rawValue,
        inputErrors: errors?.toArray(),
        transferInputs: safeAssign({}, transfer, {
          isCctp: !!transfer?.isCctp,
        }),
      };
    },

    setTradePageForm: (state, action: PayloadAction<'TRADE' | 'CLOSE_POSITION'>) => {
      state.currentTradePageForm = action.payload;
    },
  },
});

export const { setInputs, setTradePageForm } = inputsSlice.actions;
