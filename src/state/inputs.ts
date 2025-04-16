import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { type InputError, type Inputs, type TransferInputs } from '@/constants/abacus';

import { safeAssign } from '@/lib/objectHelpers';
import { Nullable } from '@/lib/typeUtils';

export interface InputsState {
  // remove all these when old withdraw form is gone
  current?: Nullable<string>;
  inputErrors?: Nullable<InputError[]>;
  transferInputs?: Nullable<TransferInputs>;
}

const initialState: InputsState = {
  current: undefined,
  inputErrors: undefined,
  transferInputs: undefined,
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
  },
});

export const { setInputs } = inputsSlice.actions;
