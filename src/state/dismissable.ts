import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

// NOTE: This app slice is persisted via redux-persist. Changes to this type may require migrations.
export interface DismissableState {
  hasSeenPredictionMarketIntroDialog: boolean;
  dismissedAffiliateBanner: boolean;
  hasSeenUnlimitedAnnouncement: boolean; // deprecated
  hasDismissedPmlBanner: boolean;
}

const initialState: DismissableState = {
  hasSeenPredictionMarketIntroDialog: false,
  dismissedAffiliateBanner: false,
  hasSeenUnlimitedAnnouncement: false,
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
