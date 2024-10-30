import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { FunkitDeposit } from '@/constants/funkit';

// NOTE: This app slice is persisted via redux-persist. Changes to this type may require migrations.
export interface FunkitDepositsState {
  deposits: Record<string, FunkitDeposit>;
}

const initialState: FunkitDepositsState = {
  deposits: {},
};

export const funkitDepositsSlice = createSlice({
  name: 'Funkit Deposits',
  initialState,
  reducers: {
    updateFunkitDeposit: (state, action: PayloadAction<FunkitDeposit>) => {
      state.deposits[action.payload.checkoutId] = action.payload;
    },
    removeFunkitDeposit: (state, action: PayloadAction<string>) => {
      delete state.deposits[action.payload];
    },
  },
});

export const { updateFunkitDeposit, removeFunkitDeposit } = funkitDepositsSlice.actions;
