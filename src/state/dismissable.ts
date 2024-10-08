import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface DismissableState {
  hasSeenPolymarketDialog: boolean;
}

const initialState: DismissableState = {
  hasSeenPolymarketDialog: false,
};

export const dismissableSlice = createSlice({
  name: 'Dismissable',
  initialState,
  reducers: {
    setHasSeenPolymarketDialog: (state, action: PayloadAction<boolean>) => {
      state.hasSeenPolymarketDialog = action.payload;
    },
  },
});

export const { setHasSeenPolymarketDialog } = dismissableSlice.actions;
