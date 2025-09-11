import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

// NOTE: This app slice is persisted via redux-persist. Changes to this type may require migrations.
export interface DismissableState {
  hasSeenPredictionMarketIntroDialog: boolean;
  dismissedAffiliateBanner: boolean;
  hasSeenUnlimitedAnnouncement: boolean; // deprecated
  hasDismissedPmlBanner: boolean;
  hasDismissedPumpBanner: boolean;
  hasDismissedSurgeBanner: boolean;
  hasDismissedRebateBanner: boolean;
}

const initialState: DismissableState = {
  hasSeenPredictionMarketIntroDialog: false,
  dismissedAffiliateBanner: false,
  hasSeenUnlimitedAnnouncement: false,
  hasDismissedPmlBanner: false,
  hasDismissedPumpBanner: false,
  hasDismissedSurgeBanner: false,
  hasDismissedRebateBanner: false,
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
    setHasDismissedPumpBanner: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedPumpBanner = action.payload;
    },
    setHasDismissedSurgeBanner: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedSurgeBanner = action.payload;
    },
    setHasDismissedRebateBanner: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedRebateBanner = action.payload;
    },
  },
});

export const {
  setHasSeenPredictionMarketIntroDialog,
  setDismissedAffiliateBanner,
  setHasDismissedPmlBanner,
  setHasDismissedPumpBanner,
  setHasDismissedSurgeBanner,
  setHasDismissedRebateBanner,
} = dismissableSlice.actions;
