import type { WalletQueries } from '@sdk/Accounts';
import type { AssetId } from '@sdk/shared/types';
import type { MarketCommands, MarketQueries } from '../../Markets';
import { type PositionsQueries, filterPositionsByAccountAddress } from '../../Positions';

export interface FetchLatestAccountTrackedAssetPricesWorkflowDependencies {
  walletQueries: WalletQueries;
  marketQueries: MarketQueries;
  marketCommands: MarketCommands;
  positionsQueries: PositionsQueries;
}

export const createFetchLatestAccountTrackedAssetPricesWorkflow =
  (deps: FetchLatestAccountTrackedAssetPricesWorkflowDependencies) => async () => {
    const currentUserAddress = deps.walletQueries.getCurrentUserAddress();
    if (!currentUserAddress) return;

    const baseAsset = deps.marketQueries.getBaseAsset();
    const watchedAsset = deps.marketQueries.getWatchedAsset();
    const userOpenPositions = filterPositionsByAccountAddress(
      deps.positionsQueries.getAllLatestPositions(),
      currentUserAddress
    ).filter((p) => deps.positionsQueries.isPositionOpen(p.stableId));

    const assetsFetchQueue = new Set<AssetId>();

    userOpenPositions.forEach((p) => {
      assetsFetchQueue.add(p.assetId);
    });

    if (baseAsset) assetsFetchQueue.add(baseAsset.assetId);
    if (watchedAsset) assetsFetchQueue.add(watchedAsset.assetId);

    await Promise.all(
      [...assetsFetchQueue].map((id) => deps.marketCommands.fetchLatestAssetPrice(id))
    );
  };
