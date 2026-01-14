import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/shared/lib/redux';
import type { AssetId } from '@/shared/types';
import { assetPricesAdapter } from './types';

const selectAssetPricesState = (state: RootState) => state.markets.assetPrices;

const selectors = assetPricesAdapter.getSelectors(selectAssetPricesState);

export const selectAllAssetPrices = selectors.selectAll;

export const selectAssetPricesFetchStatus = createSelector(
  [selectAssetPricesState],
  (state) => state.fetchStatus
);

export const selectAssetPricesError = createSelector(
  [selectAssetPricesState],
  (state) => state.error
);

export const selectAssetPricesByAssetId = createSelector(
  [selectAllAssetPrices, (_state, assetId?: AssetId) => assetId],
  (allAssets, assetId) => allAssets.filter((ap) => ap.assetId === assetId) ?? []
);
