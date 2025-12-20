// Main client
export { createStarboardClient } from './client';
export type { StarboardClient, StarboardClientConfig } from './client';

// Shared types
export * as Types from './shared/types';

// Trading domain (namespace export for advanced usage)
export * as Trading from './trading';

// Trading domain types - Positions
export type { Position, PositionKey, RiskMetrics } from './trading/src/positions';
export { PositionStatus, PositionSide, PositionChange } from './trading/src/positions';

// Trading domain types - Markets
export type { MarketConfig, OraclePriceData } from './trading/src/markets';

// Cross-domain types - Portfolio
export type { PortfolioMetrics } from './cross-domain/portfolio';

// Redux state management
export type { DataResult } from './shared/lib/store-service';

// Generated GraphQL types (for advanced usage)
export * as GraphQL from './generated/graphql';
