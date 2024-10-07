import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { TradeLayouts } from '@/constants/layout';
import { LOCAL_STORAGE_VERSIONS, LocalStorageKey } from '@/constants/localStorage';

import { getLocalStorage, setLocalStorage } from '@/lib/localStorage';

export interface LayoutState {
  selectedTradeLayout: {
    version: string;
    layout: TradeLayouts;
  };
  isSidebarOpen: boolean;
}

const initialState = {
  selectedTradeLayout: getLocalStorage({
    key: LocalStorageKey.SelectedTradeLayout,
    defaultValue: {
      version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.SelectedTradeLayout],
      layout: TradeLayouts.Default,
    },
  }),
  isSidebarOpen: true,
};

export const layoutSlice = createSlice({
  name: 'Layout',
  initialState,
  reducers: {
    setSelectedTradeLayout: (state: LayoutState, { payload }: PayloadAction<TradeLayouts>) => {
      setLocalStorage({
        key: LocalStorageKey.SelectedTradeLayout,
        value: {
          version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.SelectedTradeLayout],
          layout: payload,
        },
      });
      state.selectedTradeLayout = {
        version: LOCAL_STORAGE_VERSIONS[LocalStorageKey.SelectedTradeLayout],
        layout: payload,
      };
    },
    setIsSidebarOpen: (state: LayoutState, { payload }: PayloadAction<boolean>) => ({
      ...state,
      isSidebarOpen: payload,
    }),
  },
});

export const { setSelectedTradeLayout, setIsSidebarOpen } = layoutSlice.actions;
