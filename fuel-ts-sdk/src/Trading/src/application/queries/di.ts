import type { CalculateRiskMetricsDependencies } from './calculateRiskMetrics';
import { createGetAccountOpenPositions } from './getAccountOpenPositions';
import {
  type GetAccountWatchedAssetOpenPositionsDeps,
  createGetAccountWatchedAssetOpenPositions,
} from './getAccountWatchedAssetOpenPositions';

export type TradingQueriesDependencies = CalculateRiskMetricsDependencies &
  GetAccountWatchedAssetOpenPositionsDeps;

export function createTradingQueries(deps: TradingQueriesDependencies) {
  return {
    getAccountWatchedAssetOpenPositions: createGetAccountWatchedAssetOpenPositions(deps),
    getAccountOpenPositions: createGetAccountOpenPositions(deps),
  };
}
