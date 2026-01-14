import type { AssetId } from '@/shared/types';
import type { AssetEntity } from '../../../domain';

export interface AssetsState {
  data: AssetEntity[];
  watchedAssetId: AssetId | undefined;
  baseAssetId: AssetId | undefined;
}

export const assetsInitialState: AssetsState = {
  data: [],
  watchedAssetId: undefined,
  baseAssetId: undefined,
};
