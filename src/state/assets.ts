import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { type Asset } from '@/constants/abacus';

export interface AssetsState {
  assets?: Record<string, Asset>;
}

const initialState: AssetsState = {
  assets: undefined,
};

export const assetsSlice = createSlice({
  name: 'Assets',
  initialState,
  reducers: {
    setAssets: (state: AssetsState, action: PayloadAction<Record<string, Asset>>) => ({
      ...state,
      assets: action.payload,
    }),
  },
});

export const { setAssets } = assetsSlice.actions;
