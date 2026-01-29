import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { AssetId } from '@sdk/shared/types';
import { asyncFetchMarketStatsByAssetIdThunk } from '../../infrastructure';

export interface FetchMarketStatsCommandDependencies {
  storeService: StoreService;
}

export const createFetchMarketStatsCommand =
  (deps: FetchMarketStatsCommandDependencies) => async (assetId: AssetId) => {
    await deps.storeService.dispatch(asyncFetchMarketStatsByAssetIdThunk(assetId));
  };
