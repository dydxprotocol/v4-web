import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface LayoutState {
  isSidebarOpen: boolean;
}

const initialState = {
  isSidebarOpen: true,
};

export const layoutSlice = createSlice({
  name: 'Layout',
  initialState,
  reducers: {
    setIsSidebarOpen: (state: LayoutState, { payload }: PayloadAction<boolean>) => ({
      ...state,
      isSidebarOpen: payload,
    }),
  },
});

export const { setIsSidebarOpen } = layoutSlice.actions;
