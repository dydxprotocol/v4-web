import type { Address } from '@sdk/shared/types';
import type { MarketQueries } from '../../Markets';
import type { PositionsQueries } from '../../Positions';
import { filterPositionsByAsset, isPositionOpen } from '../../Positions';

export interface GetAccountWatchedAssetOpenPositionsDeps {
  marketQueries: MarketQueries;
  positionsQueries: PositionsQueries;
}

export const createGetAccountWatchedAssetOpenPositions =
  (deps: GetAccountWatchedAssetOpenPositionsDeps) => (accountAddress?: Address) => {
    const watchedAsset = deps.marketQueries.getWatchedAsset();
    if (!watchedAsset) return [];

    const userPositions = deps.positionsQueries.getAccountPositions(accountAddress);

    return filterPositionsByAsset(userPositions, watchedAsset.assetId).filter((p) =>
      isPositionOpen(p)
    );
  };
