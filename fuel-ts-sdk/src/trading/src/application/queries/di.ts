import {
  type CalculateInitialMarginDependencies,
  createCalculateInitialMargin,
} from './calculate-initial-margin';
import {
  type CalculateMaxLeverageDependencies,
  createCalculateMaxLeverage,
} from './calculate-max-leverage';
import type { CalculateRiskMetricsDependencies } from './calculate-risk-metrics';
import { createCalculateRiskMetrics } from './calculate-risk-metrics';
import {
  type GetAccountWatchedAssetPositionsDeps,
  createGetAccountWatchedAssetPositions,
} from './get-account-watched-asset-positions';

export type TradingQueriesDependencies = CalculateInitialMarginDependencies &
  CalculateMaxLeverageDependencies &
  CalculateRiskMetricsDependencies &
  GetAccountWatchedAssetPositionsDeps;

export function createTradingQueries(deps: TradingQueriesDependencies) {
  const calculateInitialMargin = createCalculateInitialMargin(deps);
  const calculateMaxLeverage = createCalculateMaxLeverage(deps);
  const calculateRiskMetrics = createCalculateRiskMetrics(deps);
  const getAccountWatchedAssetPositions = createGetAccountWatchedAssetPositions(deps);

  return {
    calculateInitialMargin,
    calculateMaxLeverage,
    calculateRiskMetrics,
    getAccountWatchedAssetPositions,
  };
}
