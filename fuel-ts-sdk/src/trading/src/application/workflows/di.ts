import type { FetchLatestBaseAndWatchedAssetsPricesDeps } from './fetch-latest-base-and-watched-assets-prices.workflow';
import { createFetchLatestBaseAndWatchedAssetsPricesWorkflow } from './fetch-latest-base-and-watched-assets-prices.workflow';

export const createTradingWorkflows = (deps: TradingWorkflowsDependencies) => {
  return {
    fetchLatestBaseAndWatchedAssetsPrices:
      createFetchLatestBaseAndWatchedAssetsPricesWorkflow(deps),
  };
};

export type TradingWorkflowsDependencies = FetchLatestBaseAndWatchedAssetsPricesDeps;
