import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/client';
import type { AssetId } from '@/shared/types';
import type { Asset } from '../../../domain';
import type { AssetsState } from './assets.types';

const selectAssetsState = (state: RootState): AssetsState => state.markets.assets;

export const selectAllAssets = createSelector(selectAssetsState, (state): Asset[] => state.data);

export const selectAssetById = createSelector(
  [selectAllAssets, (_state, assetId: AssetId) => assetId],
  (assets, assetId) => assets.find((asset) => asset.assetId === assetId)
);

export const selectWatchedAssetId = createSelector(
  selectAssetsState,
  (state) => state.watchedAssetId
);

export const selectWatchedAsset = createSelector(
  [selectAllAssets, selectWatchedAssetId],
  (allAssets, watchedAssetId) => allAssets.find((a) => a.assetId === watchedAssetId)
);
