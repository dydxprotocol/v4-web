import {
  type CalculateInitialMarginDependencies,
  createCalculateInitialMargin,
} from './calculate-initial-margin';
import {
  type CalculateMaxLeverageDependencies,
  createCalculateMaxLeverage,
} from './calculate-max-leverage';
import {
  CalculateRiskMetricsDependencies,
  createCalculateRiskMetrics,
} from './calculate-risk-metrics';

export type TradingDomainQueriesDependencies = CalculateInitialMarginDependencies &
  CalculateMaxLeverageDependencies &
  CalculateRiskMetricsDependencies;

export function createTradingDomainQueries(deps: TradingDomainQueriesDependencies) {
  const calculateInitialMargin = createCalculateInitialMargin(deps);
  const calculateMaxLeverage = createCalculateMaxLeverage(deps);
  const calculateRiskMetrics = createCalculateRiskMetrics(deps);

  return {
    calculateInitialMargin,
    calculateMaxLeverage,
    calculateRiskMetrics,
  };
}
