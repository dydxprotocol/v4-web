import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { DialogType, TradeBoxDialogType } from '@/constants/dialogs';

export interface DialogsState {
  activeDialog?: DialogType;
  activeTradeBoxDialog?: TradeBoxDialogType;
  dialogQueue: DialogType[];
}

const initialState: DialogsState = {
  activeDialog: undefined,
  activeTradeBoxDialog: undefined,
  dialogQueue: [],
};

export const dialogsSlice = createSlice({
  name: 'Dialogs',
  initialState,
  reducers: {
    openDialog: (state, action: PayloadAction<DialogType>) => {
      if (state.activeDialog?.tag === action.payload.tag) return;

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
  },
});

export const {
  forceOpenDialog,
  closeDialog,
  closeDialogInTradeBox,
  openDialog,
  openDialogInTradeBox,
} = dialogsSlice.actions;
