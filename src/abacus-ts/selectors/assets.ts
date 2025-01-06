import { createAppSelector } from '@/state/appTypes';

import { transformAssetsInfo } from '../calculators/assets';
import { selectRawAssets, selectRawAssetsData } from './base';
import { selectCurrentMarketInfo } from './markets';

export const selectAllAssetsInfo = createAppSelector([selectRawAssetsData], (assets) =>
  transformAssetsInfo(assets)
);

export const selectAllAssetsInfoLoading = createAppSelector(
  [selectRawAssets],
  (assets) => assets.status
);

export const selectCurrentMarketAssetInfo = createAppSelector(
  [selectCurrentMarketInfo, selectAllAssetsInfo],
  (currentMarketInfo, assets) => {
    if (currentMarketInfo == null || assets == null) {
      return undefined;
    }

    return assets[currentMarketInfo.assetId];
  }
);
