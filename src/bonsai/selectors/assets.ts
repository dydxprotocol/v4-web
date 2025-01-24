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
    [selectAllAssetsInfo, (_s, assetId: string) => assetId],
    (assets, assetId) => assets?.[assetId]
  );
