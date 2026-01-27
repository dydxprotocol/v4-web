import type { MarketCommands, MarketQueries } from '../../Markets';

export interface FetchLatestBaseAndWatchedAssetsPricesDeps {
  marketCommands: MarketCommands;
  marketQueries: MarketQueries;
}

export const createFetchLatestBaseAndWatchedAssetsPricesWorkflow =
  (deps: FetchLatestBaseAndWatchedAssetsPricesDeps) => async () => {
    const watchedAsset = deps.marketQueries.getWatchedAsset();
    const baseAsset = deps.marketQueries.getBaseAsset();

    const promises: Promise<unknown>[] = [];

    if (watchedAsset)
      promises.push(deps.marketCommands.fetchLatestAssetPrice(watchedAsset.assetId));
    if (baseAsset) promises.push(deps.marketCommands.fetchLatestAssetPrice(baseAsset.assetId));

    await Promise.all(promises);
  };
