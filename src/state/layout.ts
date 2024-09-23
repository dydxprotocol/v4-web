import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { TradeLayouts } from '@/constants/layout';
import { LocalStorageKey } from '@/constants/localStorage';

import { getLocalStorage, setLocalStorage } from '@/lib/localStorage';

export interface LayoutState {
  selectedTradeLayout: TradeLayouts;
  isSidebarOpen: boolean;
}

const initialState = {
  selectedTradeLayout: getLocalStorage({
    key: LocalStorageKey.SelectedTradeLayout,
    defaultValue: TradeLayouts.Default,
  }),
  isSidebarOpen: true,
};

export const layoutSlice = createSlice({
  name: 'Layout',
  initialState,
  reducers: {
    setSelectedTradeLayout: (state: LayoutState, { payload }: PayloadAction<TradeLayouts>) => {
      setLocalStorage({ key: LocalStorageKey.SelectedTradeLayout, value: payload });
      state.selectedTradeLayout = payload;
    },
    setIsSidebarOpen: (state: LayoutState, { payload }: PayloadAction<boolean>) => ({
      ...state,
      isSidebarOpen: payload,
    }),
  },
});

export const { setSelectedTradeLayout, setIsSidebarOpen } = layoutSlice.actions;
