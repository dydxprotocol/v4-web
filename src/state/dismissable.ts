import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface DismissableState {
  hasSeenPredictionMarketIntroDialog: boolean;
  dismissedAffiliateBanner: boolean;
  hasDismissedPmlBanner: boolean;
}

const initialState: DismissableState = {
  hasSeenPredictionMarketIntroDialog: false,
  dismissedAffiliateBanner: false,
  hasDismissedPmlBanner: false,
};

export const dismissableSlice = createSlice({
  name: 'Dismissable',
  initialState,
  reducers: {
    setHasSeenPredictionMarketIntroDialog: (state, action: PayloadAction<boolean>) => {
      state.hasSeenPredictionMarketIntroDialog = action.payload;
    },
    setDismissedAffiliateBanner: (state, action: PayloadAction<boolean>) => {
      state.dismissedAffiliateBanner = action.payload;
    },
    setHasDismissedPmlBanner: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedPmlBanner = action.payload;
    },
  },
});

export const {
  setHasSeenPredictionMarketIntroDialog,
  setDismissedAffiliateBanner,
  setHasDismissedPmlBanner,
} = dismissableSlice.actions;
