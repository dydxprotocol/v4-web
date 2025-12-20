import type { StoreService } from '@/shared/lib/store-service';
import type { GraphQLClient } from 'graphql-request';

import { createGraphQLPositionRepository } from './adapter';
import { createPositionDataService } from './services/position-data.service';

export {
  calculateEntryPrice,
  filterClosedPositions,
  filterOpenPositions,
  getPositionSide,
  getPositionStatus,
  isPositionClosed,
  isPositionOpen,
  PositionChange,
  PositionKeySchema,
  PositionSchema,
  PositionSide,
  PositionStatus,
  RiskMetricsSchema,
} from './domain';
export type { Position, PositionKey, RiskMetrics } from './domain';

export type { GetPositionsOptions, PositionRepository } from './port';

export { createGraphQLPositionRepository } from './adapter';

export {
  calculateLeverage,
  calculateLiquidationPrice,
  calculateNotional,
  calculateUnrealizedPnl,
  calculateUnrealizedPnlPercent,
} from './services/position-metrics.service';

export {
  calculateInitialMargin,
  calculateMaintenanceMargin,
  calculateMaxLeverage,
  calculatePositionHealth,
  calculateRiskMetrics,
} from './services/risk.service';

export type { PositionDataService } from './services/position-data.service';

export { positionsReducer, type PositionsThunkExtra } from './state/positions/index';

export function createRepositories(graphqlClient: GraphQLClient) {
  return {
    graphQLPositionRepository: createGraphQLPositionRepository(graphqlClient),
  };
}

export function createServices(storeService: StoreService) {
  return {
    positionDataService: createPositionDataService(storeService),
  };
}
