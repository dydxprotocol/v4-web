import type { FetchLatestBaseAndWatchedAssetsPricesDeps } from './fetchLatestBaseAndWatchedAssetsPrices';
import { createFetchLatestBaseAndWatchedAssetsPricesWorkflow } from './fetchLatestBaseAndWatchedAssetsPrices';

export const createTradingWorkflows = (deps: TradingWorkflowsDependencies) => {
  return {
    fetchLatestBaseAndWatchedAssetsPrices:
      createFetchLatestBaseAndWatchedAssetsPricesWorkflow(deps),
  };
};

export type TradingWorkflowsDependencies = FetchLatestBaseAndWatchedAssetsPricesDeps;
