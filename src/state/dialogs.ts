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
    addDialogToQueue: (state: DialogsState, action: PayloadAction<DialogInfo<DialogTypes>>) => {
      const dialogQueue = state.dialogQueue;
      dialogQueue.push(action.payload);

      return {
        ...state,
        dialogQueue,
      };
    },
    closeDialog: (state: DialogsState) => ({
      ...state,
      activeDialog: state.dialogQueue.shift(),
    }),
    openDialog: (state: DialogsState, action: PayloadAction<DialogInfo<DialogTypes>>) => ({
      ...state,
      activeDialog: action.payload,
    }),
    closeDialogInTradeBox: (state: DialogsState) => ({
      ...state,
      activeTradeBoxDialog: undefined,
    }),
    openDialogInTradeBox: (
      state: DialogsState,
      action: PayloadAction<DialogInfo<TradeBoxDialogTypes>>
    ) => ({
      ...state,
      activeTradeBoxDialog: action.payload,
    }),
  },
});

export const {
  addDialogToQueue,
  closeDialog,
  closeDialogInTradeBox,
  openDialog,
  openDialogInTradeBox,
} = dialogsSlice.actions;
