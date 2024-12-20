import { createSelector } from 'reselect';

import { transformAssetsInfo } from '../calculators/assets';
import { selectRawAssets, selectRawAssetsData } from './base';
import { selectCurrentMarketInfo } from './markets';

export const selectAllAssetsInfo = createSelector([selectRawAssetsData], (assets) =>
  transformAssetsInfo(assets)
);

export const selectAllAssetsInfoLoading = createSelector(
  [selectRawAssets],
  (assets) => assets.status
);

export const selectCurrentMarketAssetInfo = createSelector(
  [selectCurrentMarketInfo, selectAllAssetsInfo],
  (currentMarketInfo, assets) => {
    if (currentMarketInfo == null || assets == null) {
      return undefined;
    }

    return assets[currentMarketInfo.assetId];
  }
);
