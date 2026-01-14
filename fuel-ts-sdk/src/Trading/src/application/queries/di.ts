import type { CalculateRiskMetricsDependencies } from './calculateRiskMetrics';
import {
  type GetAccountWatchedAssetPositionsDeps,
  createGetAccountWatchedAssetPositions,
} from './getAccountWatchedAssetPositions';

export type TradingQueriesDependencies = CalculateRiskMetricsDependencies &
  GetAccountWatchedAssetPositionsDeps;

export function createTradingQueries(deps: TradingQueriesDependencies) {
  const getAccountWatchedAssetPositions = createGetAccountWatchedAssetPositions(deps);

  return {
    getAccountWatchedAssetPositions,
  };
}
