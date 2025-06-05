import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { DialogType, TradeBoxDialogType } from '@/constants/dialogs';

export interface DialogsState {
  activeDialog?: DialogType;
  activeTradeBoxDialog?: TradeBoxDialogType;
  isUserMenuOpen: boolean;
  dialogQueue: DialogType[];
}

const initialState: DialogsState = {
  activeDialog: undefined,
  activeTradeBoxDialog: undefined,
  isUserMenuOpen: false,
  dialogQueue: [],
};

export const dialogsSlice = createSlice({
  name: 'Dialogs',
  initialState,
  reducers: {
    openDialog: (state, action: PayloadAction<DialogType>) => {
      if (state.activeDialog?.type === action.payload.type) return;

      if (state.activeDialog) {
        state.dialogQueue.push(action.payload);
      } else {
        state.activeDialog = action.payload;
      }
    },
    closeDialog: (state) => {
      state.activeDialog = state.dialogQueue.shift();
    },
    forceOpenDialog: (state, action: PayloadAction<DialogType>) => {
      if (state.activeDialog) {
        state.dialogQueue.unshift(state.activeDialog);
      }
      state.activeDialog = action.payload;
    },
    closeDialogInTradeBox: (state) => {
      state.activeTradeBoxDialog = undefined;
    },
    openDialogInTradeBox: (state, action: PayloadAction<TradeBoxDialogType>) => {
      state.activeTradeBoxDialog = action.payload;
    },
    setIsUserMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isUserMenuOpen = action.payload;
    },
  },
});

export const {
  forceOpenDialog,
  closeDialog,
  closeDialogInTradeBox,
  openDialog,
  openDialogInTradeBox,
  setIsUserMenuOpen,
} = dialogsSlice.actions;
