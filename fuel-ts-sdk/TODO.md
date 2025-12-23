# Positions Subdomain Reorganization

This document tracks the reorganization of the Positions subdomain to match the Markets pattern.

## Current Structure Analysis

### Domain Layer
- ✅ `domain/positions.schemas.ts` - Zod schemas
- ✅ `domain/risk.schemas.ts` - Zod schemas for risk
- ✅ `domain/positions.decimals.ts` - Decimal helpers
- ✅ `domain/positions.accessors.ts` - Domain accessors (pure functions)
- ⚠️ `domain/positions.models.ts` - Should be `positions.types.ts`
- ⚠️ `domain/risk.models.ts` - Should be `risk.types.ts`

### Port Layer
- ⚠️ `port.ts` - Should move to `domain/positions.port.ts` (and split `risk.port.ts` if needed)

### Adapter Layer
- ⚠️ `adapter/repository.ts` - Should be `adapter/graphql-positions/repository.ts`
- ⚠️ `adapter/positions.repository.ts` - Duplicate? Need to investigate
- ✅ `adapter/operations/get-positions.query.ts` - GraphQL query
- ✅ `adapter/operations/get-positions.ts` - Operation implementation
- ✅ `adapter/operations/get-positions-by-account.ts`
- ✅ `adapter/operations/get-positions-by-asset.ts`
- ✅ `adapter/operations/get-current-positions.ts`

### Services Layer (TO REORGANIZE)
- ⚠️ `services/position-metrics.service.ts` - Should move to `application/queries/`
  - Functions: `calculateNotional`, `calculateUnrealizedPnl`, `calculateUnrealizedPnlPercent`, `calculateLeverage`, `calculateLiquidationPrice`
- ⚠️ `services/risk.service.ts` - Should move to `application/queries/`
  - Functions: `calculateInitialMargin`, `calculateMaintenanceMargin`, `calculateMaxLeverage`, `calculatePositionHealth`, `calculateRiskMetrics`

### State Layer
- ⚠️ `state/positions/positions.slice.ts` - Uses `Record<Address, Position[]>` instead of entity adapters
- ✅ `state/positions/positions.selectors.ts` - Keep in state layer
- ✅ `state/positions/positions.thunks.ts`
- ✅ `state/positions/positions.types.ts`
- ✅ `state/positions/positions.actions.ts`

### Application Layer (NEEDS CREATION)
- ❌ `application/commands/` - Needs to be created (if any write operations)
- ⚠️ `application/queries/di.ts` - Exists but empty
- ❌ `application/queries/*.query.ts` - Need to move services here

## Tasks

### 1. Domain Layer Cleanup ✅ COMPLETED
- [x] Rename `domain/positions.models.ts` → `domain/positions.types.ts`
- [x] Rename `domain/risk.models.ts` → `domain/risk.types.ts`
- [x] Move `port.ts` → `domain/positions.port.ts`
- [x] Update all imports across codebase
- Note: No separate risk.port.ts needed - all in positions.port.ts

### 2. Adapter Layer Reorganization ✅ COMPLETED
- [x] Removed duplicate `adapter/repository.ts` (kept positions.repository.ts)
- [x] Renamed adapter directory to: `adapter/graphql-positions/`
- [x] Moved operations to `adapter/graphql-positions/operations/`
- [x] Moved repository to `adapter/graphql-positions/repository.ts`
- [x] Created `adapter/graphql-positions/index.ts` gateway
- [x] Created `adapter/index.ts` to export from graphql-positions

### 3. Application Layer Creation ✅ PARTIALLY COMPLETED
- [x] Created `application/commands/` for thunk-based commands
  - Created `fetch-positions-by-account.ts`
  - Created `fetch-current-positions.ts`
  - Created `commands/di.ts` assembler
- [x] Created `application/queries/` for position metrics (pure functions)
  - Created `calculate-notional.ts`
  - Created `calculate-unrealized-pnl.ts`
  - Created `calculate-unrealized-pnl-percent.ts`
  - Created `calculate-leverage.ts`
  - Created `queries/di.ts` assembler
- [x] Deleted old `services/` directory
- ⚠️ **PENDING**: Risk calculations and calculations needing MarketConfig need to move to `trading/cross-domain`
  - These include: `calculateLiquidationPrice`, `calculateInitialMargin`, `calculateMaintenanceMargin`, `calculateMaxLeverage`, `calculatePositionHealth`, `calculateRiskMetrics`

### 4. State Layer Entity Adapters ✅ COMPLETED
- [x] Updated `state/positions/positions.types.ts` to use entity adapter pattern
- [x] Created entity adapter with `PositionId` as key
- [x] Updated slice to use `positionsAdapter.upsertMany()`
- [x] Updated reducers to use entity adapter methods
- [x] Updated selectors to use entity adapter selectors
- [x] Updated thunks to import from domain barrel export

### 5. DI Container Strategy ✅ COMPLETED
- [x] Created `application/commands/di.ts` for command factory
- [x] Created `application/queries/di.ts` for query factory
- [x] Main `trading/di.ts` already wired to use new structure
- Note: Adapter doesn't need di.ts - single repository factory exported directly

### 6. Gateway and Export Updates ✅ COMPLETED
- [x] Updated `domain/index.ts` to export from renamed types files and positions.port.ts
- [x] Updated `adapter/index.ts` to export from graphql-positions
- [x] Updated main `index.ts` to expose di factories for commands and queries
- [x] Imports work via `@/trading/src/positions` barrel export

## Architecture Decisions

### Pure Functions vs DI
- **Pure domain functions** (accessors, helpers): Export directly through `index.ts` gateways
- **Queries needing dependencies**: Use DI container pattern with `di.ts`
- **Commands needing side effects**: Use DI container pattern with `di.ts`

### Import Patterns
- **External package consumers**: `fuel-ts-sdk/trading/positions`
- **Internal codebase**: `@/trading/src/positions`
- Both go through `index.ts` gateways

### Cross-Domain Access
- Portfolio should import from `@/trading/src/positions` (internal)
- Portfolio queries like `calculateNotional`, `calculateUnrealizedPnl` should be available through positions gateway
- No reaching into domain internals from cross-domain code

## Notes
- All queries are currently pure functions (no dependencies)
- May need DI in future if we add dependencies (e.g., fetching market config)
- Selectors stay in state layer (special case for frontend `useSelector`)
- Entity adapters needed for normalized state management
