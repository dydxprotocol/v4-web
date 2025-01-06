import { createAppSelector } from '@/state/appTypes';

import { transformAssetsInfo } from '../calculators/assets';
import { selectRawAssetsData } from './base';
import { selectCurrentMarketInfo } from './markets';

export const selectAllAssetsInfo = createAppSelector([selectRawAssetsData], (assets) =>
  transformAssetsInfo(assets)
);

export const selectAssetInfo = () =>
  createAppSelector(
    [selectAllAssetsInfo, (_s, assetId: string) => assetId],
    (assets, assetId) => assets?.[assetId]
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
