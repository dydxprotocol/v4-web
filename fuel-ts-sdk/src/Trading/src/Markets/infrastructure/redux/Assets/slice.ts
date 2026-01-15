import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { AssetId } from '@sdk/shared/types';
import type { AssetEntity } from '../../../domain';
import { assetsInitialState } from './types';

const assetsSlice = createSlice({
  name: 'assets',
  initialState: assetsInitialState,
  reducers: {
    populateAssets(state, action: PayloadAction<AssetEntity[]>) {
      state.data = action.payload;
      state.watchedAssetId = action.payload.at(0)?.assetId;
      state.baseAssetId = action.payload.find((asset) => asset.isBaseAsset)?.assetId;
    },
    watchAsset(state, action: PayloadAction<AssetId>) {
      state.watchedAssetId = action.payload;
    },
  },
});

export const { reducer: assetsReducer, actions: assetsActions } = assetsSlice;
