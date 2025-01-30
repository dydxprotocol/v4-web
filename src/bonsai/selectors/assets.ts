import { createAppSelector } from '@/state/appTypes';

import { transformAssetsInfo } from '../calculators/assets';
import { selectRawAssets, selectRawAssetsData } from './base';

export const selectAllAssetsInfo = createAppSelector([selectRawAssetsData], (assets) =>
  transformAssetsInfo(assets)
);

export const selectAllAssetsInfoLoading = createAppSelector(
  [selectRawAssets],
  (assets) => assets.status
);

export const createSelectAssetInfo = () =>
  createAppSelector(
    [selectAllAssetsInfo, (_s, assetId: string | undefined) => assetId],
    (assets, assetId) => {
      if (assetId == null) {
        return undefined;
      }
      return assets?.[assetId];
    }
  );

export const createSelectAssetLogo = () =>
  createAppSelector([createSelectAssetInfo()], (asset) => asset?.logo);
