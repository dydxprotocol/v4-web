import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { type Asset } from '@/constants/abacus';

import { MapOf } from '@/lib/objectHelpers';

export interface AssetsState {
  assets?: MapOf<Asset>;
}

const initialState: AssetsState = {
  assets: undefined,
};

export const assetsSlice = createSlice({
  name: 'Assets',
  initialState,
  reducers: {
    setAssets: (state: AssetsState, action: PayloadAction<MapOf<Asset>>) => ({
      ...state,
      assets: action.payload,
    }),
  },
});

export const { setAssets } = assetsSlice.actions;
