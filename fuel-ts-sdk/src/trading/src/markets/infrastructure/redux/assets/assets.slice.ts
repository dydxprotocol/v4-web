import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AssetId } from '@/shared/types';
import type { Asset } from '../../../domain';
import { assetsInitialState } from './assets.types';

const assetsSlice = createSlice({
  name: 'assets',
  initialState: assetsInitialState,
  reducers: {
    populateAssets(state, action: PayloadAction<Asset[]>) {
      state.data = action.payload;
      state.watchedAssetId = action.payload.at(0)?.assetId;
    },
    watchAsset(state, action: PayloadAction<AssetId>) {
      state.watchedAssetId = action.payload;
    },
  },
});

export const { reducer: assetsReducer, actions: assetsActions } = assetsSlice;
