import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface DismissableState {
  hasSeenPredictionMarketIntroDialog: boolean;
}

const initialState: DismissableState = {
  hasSeenPredictionMarketIntroDialog: false,
};

export const dismissableSlice = createSlice({
  name: 'Dismissable',
  initialState,
  reducers: {
    setHasSeenPredictionMarketIntroDialog: (state, action: PayloadAction<boolean>) => {
      state.hasSeenPredictionMarketIntroDialog = action.payload;
    },
  },
});

export const { setHasSeenPredictionMarketIntroDialog } = dismissableSlice.actions;
