import { createSelector } from 'reselect';

import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { getAssetFromMarketId } from '@/lib/assetUtils';

import { transformAssetsInfo } from '../calculators/assets';
import { selectRawAssetsData } from './base';

export const createSelectAllAssetsInfo = createSelector([selectRawAssetsData], (assets) =>
  transformAssetsInfo(assets)
);

export const createSelectCurrentMarketAssetInfo = createSelector(
  [getCurrentMarketId, createSelectAllAssetsInfo],
  (currentMarket, assets) => {
    const assetId = getAssetFromMarketId(currentMarket ?? '');
    return assets?.[assetId];
  }
);
