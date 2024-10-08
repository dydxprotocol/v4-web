import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface DismissableState {
  hasSeenPredictionMarketIntoDialog: boolean;
}

const initialState: DismissableState = {
  hasSeenPredictionMarketIntoDialog: false,
};

export const dismissableSlice = createSlice({
  name: 'Dismissable',
  initialState,
  reducers: {
    setHasSeenPredictionMarketIntoDialog: (state, action: PayloadAction<boolean>) => {
      state.hasSeenPredictionMarketIntoDialog = action.payload;
    },
  },
});

export const { setHasSeenPredictionMarketIntoDialog } = dismissableSlice.actions;
