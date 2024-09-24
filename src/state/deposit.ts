import { isMainnet } from '@/constants/networks';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';


export enum DepositType {
  Funkit = 'funkit',
  Standard = 'standard',
}

export interface DepositState {
  depositType: DepositType;
}

const initialState: DepositState = {
  depositType: isMainnet ? DepositType.Funkit : DepositType.Standard,
};

export const depositSlice = createSlice({
  name: 'Deposit',
  initialState,
  reducers: {
    setDepositType: (state: DepositState, { payload }: PayloadAction<DepositType>) => ({
      ...state,
      depositType: payload,
    }),
    resetDepositType: (state: DepositState) => ({
      ...state,
      depositType: initialState.depositType,
    }),
  },
});

export const { setDepositType, resetDepositType } = depositSlice.actions;
