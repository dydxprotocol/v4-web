import { Nullable } from '@/constants/abacus';

import type { RootState } from './_store';
import { createAppSelector } from './appTypes';
import { getCurrentMarketData } from './perpetualsSelectors';

/**
 * @param state
 * @returns Record of Asset data indexed by their AssetId
 */
export const getAssets = (state: RootState) => state.assets.assets;

/**
 *
 * @param state
 * @returns Asset data of the current MarketId
 */
export const getCurrentMarketAssetData = (state: RootState) => {
  const { assetId } = getCurrentMarketData(state) ?? {};
  return assetId ? getAssets(state)?.[assetId] : undefined;
};

/**
 * @returns Asset data of specified AssetId
 */
export const getAssetData = (state: RootState, assetId: Nullable<string>) =>
  getAssets(state)?.[assetId ?? ''];

export const getAssetImageUrl = createAppSelector(
  [getAssetData],
  (assetData) => assetData?.resources?.imageUrl
);
