import type { RootState } from './_store';

import { getCurrentMarketData } from './perpetualsSelectors';

/**
 * @param state
 * @returns Record of Asset data indexed by their AssetId
 */
export const getAssets = (state: RootState) => state.assets.assets;

/**
 *
 * @param assetId
 * @returns Asset data of the specified AssetId
 */
export const getAssetData = (assetId: string) => (state: RootState) => getAssets(state)?.[assetId];

/**
 *
 * @param state
 * @returns Asset data of the current MarketId
 */
export const getCurrentMarketAssetData = (state: RootState) => {
  const { assetId } = getCurrentMarketData(state) ?? {};
  return assetId ? getAssets(state)?.[assetId] : undefined;
};
