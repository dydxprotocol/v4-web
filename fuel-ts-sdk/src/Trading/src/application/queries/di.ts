import type { GetAccountOpenPositionsQueryDeps } from './getCurrentAccountOpenPositions';
import { createGetCurrentAccountOpenPositionsQuery } from './getCurrentAccountOpenPositions';
import type { GetCurrentAccountTotalExposureQueryDependencies } from './getCurrentAccountTotalExposure';
import { createGetCurrentAccountTotalExposureQuery } from './getCurrentAccountTotalExposure';
import type { GetPositionLiquidationPriceApproxQueryDependencies } from './getPositionLiquidationPriceApprox';
import { createGetPositionLiquidationPriceApproxQuery } from './getPositionLiquidationPriceApprox';

export type TradingQueriesDependencies = GetAccountOpenPositionsQueryDeps &
  GetCurrentAccountTotalExposureQueryDependencies &
  GetPositionLiquidationPriceApproxQueryDependencies;

export function createTradingQueries(deps: TradingQueriesDependencies) {
  return {
    getCurrentAccountOpenPositions: createGetCurrentAccountOpenPositionsQuery(deps),
    getCurrentAccountTotalExposure: createGetCurrentAccountTotalExposureQuery(deps),
    getPositionLiquidationPriceApprox: createGetPositionLiquidationPriceApproxQuery(deps),
  };
}
