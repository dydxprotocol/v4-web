import type { FetchLatestAccountTrackedAssetPricesWorkflowDependencies } from './fetchLatestAccountTrackedAssetPrices';
import { createFetchLatestAccountTrackedAssetPricesWorkflow } from './fetchLatestAccountTrackedAssetPrices';
import type { FetchLatestBaseAndWatchedAssetsPricesDeps } from './fetchLatestBaseAndWatchedAssetsPrices';
import { createFetchLatestBaseAndWatchedAssetsPricesWorkflow } from './fetchLatestBaseAndWatchedAssetsPrices';

export type TradingWorkflowsDependencies = FetchLatestBaseAndWatchedAssetsPricesDeps &
  FetchLatestAccountTrackedAssetPricesWorkflowDependencies;

export const createTradingWorkflows = (deps: TradingWorkflowsDependencies) => {
  return {
    fetchLatestAccountTrackedAssetPrices: createFetchLatestAccountTrackedAssetPricesWorkflow(deps),
    fetchLatestBaseAndWatchedAssetsPrices:
      createFetchLatestBaseAndWatchedAssetsPricesWorkflow(deps),
  };
};

export type TradingWorkflows = ReturnType<typeof createTradingWorkflows>;
