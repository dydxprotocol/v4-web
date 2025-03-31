import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import assign from 'lodash/assign';

import {
  type ClosePositionInputs,
  type InputError,
  type Inputs,
  type Nullable,
  type TransferInputs,
} from '@/constants/abacus';
import { CLEARED_CLOSE_POSITION_INPUTS } from '@/constants/trade';

import { safeAssign } from '@/lib/objectHelpers';

type ClosePositionFormInputs = typeof CLEARED_CLOSE_POSITION_INPUTS;

export interface InputsState {
  current?: Nullable<string>;
  inputErrors?: Nullable<InputError[]>;
  // tradeFormInputs: TradeFormInputs;
  // tradeInputs?: Nullable<TradeInputs>;
  closePositionFormInputs: ClosePositionFormInputs;
  closePositionInputs?: Nullable<ClosePositionInputs>;
  // todo - remove when we can get rid of old deposit/withdraw
  transferInputs?: Nullable<TransferInputs>;
}

const initialState: InputsState = {
  current: undefined,
  inputErrors: undefined,
  closePositionFormInputs: {
    ...CLEARED_CLOSE_POSITION_INPUTS,
  },
  transferInputs: undefined,
};

export const inputsSlice = createSlice({
  name: 'Inputs',
  initialState,
  reducers: {
    setInputs: (state, action: PayloadAction<Nullable<Inputs>>) => {
      const { current, errors, closePosition, transfer } = action.payload ?? {};

      return {
        ...state,
        current: current?.rawValue,
        inputErrors: errors?.toArray(),
        closePositionInputs: closePosition,
        transferInputs: safeAssign({}, transfer, {
          isCctp: !!transfer?.isCctp,
        }),
      };
    },

    setClosePositionFormInputs: (
      state,
      action: PayloadAction<Partial<ClosePositionFormInputs>>
    ) => {
      state.closePositionFormInputs = assign({}, state.closePositionFormInputs, action.payload);
    },
  },
});

export const { setInputs, setClosePositionFormInputs } = inputsSlice.actions;
