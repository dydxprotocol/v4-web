import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { TradeLayouts } from '@/constants/layout';
import { LocalStorageKey } from '@/constants/localStorage';

import { getLocalStorage, setLocalStorage } from '@/lib/localStorage';

export interface LayoutState {
  selectedTradeLayout: TradeLayouts;
  isSidebarOpen: boolean;
}

const initialState = {
  isSidebarOpen: true,
  selectedTradeLayout: getLocalStorage({
    key: LocalStorageKey.SelectedTradeLayout,
    defaultValue: TradeLayouts.Reverse,
  }),
};

export const layoutSlice = createSlice({
  name: 'Layout',
  initialState,
  reducers: {
    setIsSidebarOpen: (state: LayoutState, { payload }: PayloadAction<boolean>) => ({
      ...state,
      isSidebarOpen: payload,
    }),
    setSelectedTradeLayout: (state: LayoutState, { payload }: PayloadAction<TradeLayouts>) => {
      setLocalStorage({ key: LocalStorageKey.SelectedTradeLayout, value: payload });
      state.selectedTradeLayout = payload;
    },
  },
});

export const { setIsSidebarOpen, setSelectedTradeLayout } = layoutSlice.actions;
