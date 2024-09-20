import { createSlice } from '@reduxjs/toolkit';

import { type Asset } from '@/constants/abacus';

import { generateTypedSetterActions } from '@/lib/sliceActionGenerators';

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
    ...generateTypedSetterActions(initialState),
  },
});

export const { setAssets } = assetsSlice.actions;
