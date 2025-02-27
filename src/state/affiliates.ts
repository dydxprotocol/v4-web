import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

// NOTE: This app slice is persisted via redux-persist. Changes to this type may require migrations.
export interface AffiliatesState {
  latestReferrer: string | undefined;
}

const initialState: AffiliatesState = {
  latestReferrer: undefined,
};

export const affiliatesSlice = createSlice({
  name: 'Affiliates',
  initialState,
  reducers: {
    updateLatestReferrer: (state, action: PayloadAction<string>) => {
      state.latestReferrer = action.payload;
    },
    removeLatestReferrer: (state) => {
      state.latestReferrer = undefined;
    },
  },
});

export const { updateLatestReferrer, removeLatestReferrer } = affiliatesSlice.actions;
