import { type RootState } from './_store';

export const getActiveDialog = (state: RootState) => state.dialogs.activeDialog;

export const getActiveTradeBoxDialog = (state: RootState) => state.dialogs.activeTradeBoxDialog;

export const getIsUserMenuOpen = (state: RootState) => state.dialogs.isUserMenuOpen;
