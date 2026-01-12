import type { AssetId } from '@/shared/types';
import type { Asset } from '../../../domain';

export interface AssetsState {
  data: Asset[];
  watchedAssetId: AssetId | undefined;
  baseAssetId: AssetId | undefined;
}

export const assetsInitialState: AssetsState = {
  data: [],
  watchedAssetId: undefined,
  baseAssetId: undefined,
};
