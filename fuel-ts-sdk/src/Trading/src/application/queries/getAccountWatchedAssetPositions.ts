import type { Address } from '@/shared/types';
import type { MarketQueries } from '../../Markets';
import type { PositionsQueries } from '../../Positions';
import { filterPositionsByAsset } from '../../Positions';

export interface GetAccountWatchedAssetPositionsDeps {
  marketQueries: MarketQueries;
  positionsQueries: PositionsQueries;
}

export const createGetAccountWatchedAssetPositions =
  (deps: GetAccountWatchedAssetPositionsDeps) => (accountAddress?: Address) => {
    const watchedAsset = deps.marketQueries.getWatchedAsset();
    if (!watchedAsset) return [];

    const userPositions = deps.positionsQueries.getAccountPositions(accountAddress);

    return filterPositionsByAsset(userPositions, watchedAsset.assetId);
  };
