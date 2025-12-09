// Main client
export { createStarboardClient } from './client';
export type { StarboardClient, StarboardClientConfig } from './client';

// Shared types
export * as Types from './shared/types';

// Trading domain (positions, etc.)
export * as Trading from './trading';

// Generated GraphQL types (for advanced usage)
export * as GraphQL from './generated/graphql';
