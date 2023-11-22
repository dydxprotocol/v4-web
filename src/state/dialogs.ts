import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { DialogTypes, TradeBoxDialogTypes } from '@/constants/dialogs';

type DialogInfo<TDialog extends DialogTypes | TradeBoxDialogTypes> = {
  type: TDialog;
  dialogProps?: any;
};

export interface DialogsState {
  activeDialog?: DialogInfo<DialogTypes>;
  activeTradeBoxDialog?: DialogInfo<TradeBoxDialogTypes>;
  dialogQueue: DialogInfo<DialogTypes>[];
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
    openDialog: (state: DialogsState, action: PayloadAction<DialogInfo<DialogTypes>>) => {
      if (state.activeDialog?.type === action.payload.type) return;

      if (state.activeDialog) {
        state.dialogQueue.push(action.payload);
      } else {
        state.activeDialog = action.payload;
      }
    },
    closeDialog: (state: DialogsState) => {
      state.activeDialog = state.dialogQueue.shift();
    },
    forceOpenDialog: (state: DialogsState, action: PayloadAction<DialogInfo<DialogTypes>>) => {
      if (state.activeDialog) {
        state.dialogQueue.unshift(state.activeDialog);
      }
      state.activeDialog = action.payload;
    },
    closeDialogInTradeBox: (state: DialogsState) => {
      state.activeTradeBoxDialog = undefined;
    },
    openDialogInTradeBox: (
      state: DialogsState,
      action: PayloadAction<DialogInfo<TradeBoxDialogTypes>>
    ) => {
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
