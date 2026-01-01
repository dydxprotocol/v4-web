import { createSelector } from '@reduxjs/toolkit';
import { memoize } from 'lodash';
import type { RootState } from '@/shared/lib/redux';
import type { AssetId } from '@/shared/types';
import { assetPricesAdapter } from './asset-prices.types';

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

export const selectAssetPricesByAssetId = memoize((assetId: AssetId) =>
  createSelector(
    [selectAllAssetPrices],
    (data) => data.filter((ap) => ap.assetId === assetId) ?? []
  )
);

export const selectCurrentAssetPrice = memoize((assetId: AssetId) =>
  createSelector([selectAssetPricesByAssetId(assetId)], (assetPrices) => assetPrices.at(0))
);
