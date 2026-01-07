import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './_store';

export type SpotState = {
  currentSpotToken: string | undefined;
};

const initialState: SpotState = {
  currentSpotToken: undefined,
};

export const spotSlice = createSlice({
  name: 'Spot',
  initialState,
  reducers: {
    setCurrentSpotToken: (state: SpotState, action: PayloadAction<string | undefined>) => {
      state.currentSpotToken = action.payload;
    },
  },
});

export const { setCurrentSpotToken } = spotSlice.actions;

export const getCurrentSpotToken = (state: RootState) => state.spot.currentSpotToken;
