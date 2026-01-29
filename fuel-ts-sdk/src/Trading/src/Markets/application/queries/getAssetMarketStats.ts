import type { StoreService } from '@sdk/shared/lib/StoreService';
import type { MarketStatsEntity } from '../../domain';
import { marketStatsSelectors, selectWatchedAssetId } from '../../infrastructure';

export interface GetWatchedAssetMarketStatsQueryDependencies {
  storeService: StoreService;
}

export const createGetWatchedAssetMarketStatsQuery =
  (deps: GetWatchedAssetMarketStatsQueryDependencies) => (): MarketStatsEntity | undefined => {
    const watchedAssetId = deps.storeService.select(selectWatchedAssetId);
    if (!watchedAssetId) return;

    return deps.storeService.select((state) =>
      marketStatsSelectors.selectById(state, watchedAssetId)
    );
  };
