import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@sdk/shared/lib/redux';
import type { AssetId } from '@sdk/shared/types';
import type { AssetEntity } from '../../../domain';
import type { AssetsState } from './types';

const selectAssetsState = (state: RootState): AssetsState => state.trading.markets.assets;

export const selectAllAssets = createSelector(
  selectAssetsState,
  (state): AssetEntity[] => state.data
);

export const selectAssetById = createSelector(
  [selectAllAssets, (_state, assetId: AssetId) => assetId],
  (assets, assetId) => assets.find((asset) => asset.assetId === assetId)
);

export const selectWatchedAssetId = createSelector(
  selectAssetsState,
  (state) => state.watchedAssetId
);

export const selectBaseAssetId = createSelector(selectAssetsState, (state) => state.baseAssetId);

export const selectWatchedAsset = createSelector(
  [selectAllAssets, selectWatchedAssetId],
  (allAssets, watchedAssetId) => allAssets.find((a) => a.assetId === watchedAssetId)
);

export const selectBaseAsset = createSelector(
  [selectAllAssets, selectBaseAssetId],
  (allAssets, baseAssetId) => allAssets.find((a) => a.assetId === baseAssetId)
);
