import { createSelector } from 'reselect';

import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { getAssetFromMarketId } from '@/lib/assetUtils';

import { transformAssetsInfo } from '../calculators/assets';
import { selectRawAssetsData } from './base';

export const selectAllAssetsInfo = createSelector([selectRawAssetsData], (assets) =>
  transformAssetsInfo(assets)
);

export const selectCurrentMarketAssetInfo = createSelector(
  [getCurrentMarketId, selectAllAssetsInfo],
  (currentMarket, assets) => {
    const assetId = getAssetFromMarketId(currentMarket ?? '');
    return assets?.[assetId];
  }
);
