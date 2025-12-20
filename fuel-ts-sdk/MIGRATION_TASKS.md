# Fuel TS-SDK Implementation Tasks

This document tracks the implementation tasks for the `fuel-ts-sdk` - a TypeScript SDK consumed by the frontend that wraps the GraphQL indexer API and provides domain logic, calculations, and type-safe interfaces.

**Architecture Context:**
- `fuel-ts-sdk` is a **standalone SDK** following Domain-Driven Design principles
- Data comes from the **indexer's GraphQL API**
- SDK uses **Redux state management** with thunk-based dependency injection
- GraphQL subscriptions planned (deferred until backend ready)
- Services return `DataResult<T>` for status-aware operations

---

## Current Architecture Status

### ✅ Fully Implemented

#### Redux State Management Foundation
**Location:** `fuel-ts-sdk/src/shared/lib/`

**Completed:**
- ✅ `LoadableState<T>` pattern for async state (`{ data, fetchStatus, error }`)
- ✅ `createStore()` with thunk extras for dependency injection
- ✅ `StoreService` abstraction with `withRequiredData()` HOF
- ✅ `DataResult<T>` discriminated union for service responses
- ✅ Type-safe `RootState` and `AppDispatch`

#### Positions Subdomain (Full Stack)
**Location:** `fuel-ts-sdk/src/trading/src/positions/`

**Completed:**
- ✅ **Domain Layer**
  - Position models with Zod schemas (`PositionSchema`, `RiskMetricsSchema`)
  - Enums: `PositionStatus`, `PositionSide`, `PositionChange`
  - Accessors: `getPositionSide()`, `isPositionOpen()`, `filterOpenPositions()`
- ✅ **Adapter Layer**
  - GraphQL repository with operations: `getPositions()`, `getPositionsByAccount()`, `getCurrentPositions()`
  - Port interface: `PositionRepository`
- ✅ **Services Layer**
  - `position-metrics.service.ts`: `calculateNotional()`, `calculateUnrealizedPnl()`, `calculateLeverage()`, `calculateLiquidationPrice()`
  - `risk.service.ts`: `calculateInitialMargin()`, `calculateMaintenanceMargin()`, `calculateMaxLeverage()`, `calculatePositionHealth()`, `calculateRiskMetrics()`
  - `position-data.service.ts`: `getPositionsByAccount()` with StoreService integration
- ✅ **State Layer**
  - Redux slice with `LoadableState<Record<Address, Position[]>>`
  - Thunks: `fetchPositionsByAccount`, `fetchCurrentPositions`
  - Selectors: `selectPositionsByAccount`, `selectAllPositions`, `selectPositionsState`
  - Actions for synchronous updates
- ✅ **Exports**
  - `createRepositories(graphqlClient)`, `createServices(storeService)`
  - `positionsReducer`, `PositionsThunkExtra`

#### Markets Subdomain (Full Stack)
**Location:** `fuel-ts-sdk/src/trading/src/markets/`

**Completed:**
- ✅ **Domain Layer**
  - `MarketConfig` with Zod schema (IMF, MMF, tick/step sizes)
  - `OraclePriceData` models
- ✅ **Adapter Layer**
  - GraphQL repository: `getMarketConfig()`, `getOraclePrice()`, `getOraclePrices()`
  - Port interface: `MarketRepository`
- ✅ **Services Layer**
  - `market-data.service.ts` with StoreService integration
  - Methods return `DataResult<T>` with automatic status handling
- ✅ **State Layer (2 slices)**
  - **oracle-prices**: `LoadableState<Record<AssetId, OraclePrice>>`
    - Thunks: `fetchOraclePrice`, `fetchOraclePrices`
    - Selectors: `selectOraclePrice`, `selectAllOraclePrices`, `selectOraclePricesState`
  - **market-configs**: `LoadableState<Record<AssetId, MarketConfig>>`
    - Thunk: `fetchMarketConfig`
    - Selectors: `selectMarketConfig`, `selectAllMarketConfigs`, `selectMarketConfigsState`
- ✅ **Exports**
  - `createRepositories(graphqlClient)`, `createServices(storeService)`
  - `marketsReducer`, `MarketsThunkExtra`

#### Portfolio Cross-Domain Analytics
**Location:** `fuel-ts-sdk/src/cross-domain/portfolio/`

**Completed:**
- ✅ **Domain Layer**
  - `PortfolioMetrics` type with Zod schema
- ✅ **Services Layer**
  - `portfolioMetrics` object with:
    - `calculateAccountEquity()` - Total equity across all positions
    - `calculateTotalNotional()` - Sum of all position notionals
    - `calculateAccountLeverage()` - Portfolio-level leverage
    - `calculateMarginUsage()` - Margin utilization percentage
    - `calculatePortfolioMetrics()` - Aggregate calculation
- ✅ Pure functions (no state) - aggregates positions + markets data

#### Trading Module DI
**Location:** `fuel-ts-sdk/src/trading/di.ts`

**Completed:**
- ✅ `createTradingModule(graphqlClient)` factory
  - Returns `getThunkExtras()` for store initialization
  - Returns `createServices(storeService)` for service wiring
- ✅ `tradingReducer` - Combined markets + positions state
- ✅ `TradingThunkExtras` - Type-safe union of subdomain extras

#### Client Integration
**Location:** `fuel-ts-sdk/src/client.ts`

**Completed:**
- ✅ `createStarboardClient()` factory
- ✅ Creates trading module and store
- ✅ Exposes services and store for React Provider

---

## Current Tasks (In Progress)

### Task 1: Fix Broken Tests
**Priority:** HIGH
**Location:** `fuel-ts-sdk/src/trading/tests/`

**Problem:**
- Tests written for old architecture (direct repository usage)
- Now use `StoreService` with `DataResult<T>` responses
- Need to mock Redux store instead of repositories

**Acceptance Criteria:**
- [ ] Update `markets/markets-repository.test.ts` to mock store state
- [ ] Handle `DataResult<T>` responses in assertions
- [ ] Update `positions/position-metrics.test.ts` for new architecture
- [ ] Update `positions/risk.test.ts` for new architecture
- [ ] All tests pass with `pnpm test`
- [ ] Build succeeds with `pnpm build`

**Example Fix Needed:**
```typescript
// OLD (broken):
const service = createMarketDataService(mockRepository)
const config = service.getMarketConfig(assetId)
expect(config.initialMarginFraction).toBe(...)

// NEW (correct):
const mockStore = createMockStore({
  trading: {
    markets: {
      marketConfigs: {
        data: { [assetId]: mockConfig },
        fetchStatus: 'fulfilled',
        error: null
      }
    }
  }
})
const storeService = createStoreService(mockStore)
const service = createMarketDataService(storeService)
const result = service.getMarketConfig(assetId)

expect(result.status).toBe('fulfilled')
if (result.status === 'fulfilled') {
  expect(result.data.initialMarginFraction).toBe(...)
}
```

---

### Task 2: Update Client Exports ✅ COMPLETED
**Priority:** MEDIUM
**Location:** `fuel-ts-sdk/src/index.ts`

**Completed:**
- ✅ Export all domain types from `@/trading`
  - `Position`, `PositionKey`, `RiskMetrics`
  - `MarketConfig`, `OraclePriceData`
  - `PortfolioMetrics`
- ✅ Export domain enums
  - `PositionStatus`, `PositionSide`, `PositionChange`
- ✅ Export `DataResult<T>` for status-aware handling
- ✅ Pure calculation functions NOT exported (accessible via services)
- ✅ Build succeeds with tree-shaking support

**Public API Usage:**
```typescript
// Type-safe imports
import { createStarboardClient } from 'fuel-ts-sdk';
import type { Position, MarketConfig, PortfolioMetrics, DataResult } from 'fuel-ts-sdk';
import { PositionSide, PositionStatus } from 'fuel-ts-sdk';

const client = createStarboardClient({ indexerUrl: '...' });

// Service access with status-aware DataResult
const result: DataResult<Position[]> = client.trading.positions.positionDataService
  .getPositionsByAccount(accountId);

if (result.status === 'fulfilled') {
  const positions: Position[] = result.data;

  // Use enums for type safety
  const longPositions = positions.filter(p =>
    p.positionKey.isLong && PositionStatus.OPEN
  );
}

// Cross-domain analytics (pure functions)
const metrics: PortfolioMetrics = client.trading.portfolio.calculatePortfolioMetrics(
  positions,
  collateralBalance,
  oraclePrices,
  usedMargin
);

// Advanced: Namespace access for subdomain-specific features
import { Trading } from 'fuel-ts-sdk';
const notional = Trading.Positions.calculateNotional(positionHistory, oraclePrice);
```

---

## Next Steps: Complete Trading Domain

### Task 3: Implement Orders Subdomain
**Priority:** HIGH
**Story Points:** 8-10 (estimated 5-7 hours)
**User Stories:** STAR-107, STAR-108, STAR-110, STAR-113
**Location:** `fuel-ts-sdk/src/trading/src/orders/`

**Prerequisites:**
- Indexer must expose order events and fill tracking
- GraphQL schema must include Order, OrderStatus, OrderType queries

**Implementation Checklist:**

**Domain Layer:**
- [ ] Create `Order` domain model (ID, account, market, size, price, timestamp, status, type, side)
- [ ] Create `Fill` domain model for order execution history
- [ ] Define Zod schemas for validation
- [ ] Create domain enums: `OrderStatus`, `OrderType`, `OrderSide`
- [ ] Type guards and accessors

**Adapter Layer:**
- [ ] GraphQL operations: `getOrdersByAccount`, `getOrderHistory`, `getOrderFills`
- [ ] Create `OrderRepository` port interface
- [ ] Implement `GraphQLOrderRepository`

**State Layer:**
- [ ] Create `orders` Redux slice: `LoadableState<Record<Address, Order[]>>`
- [ ] Thunks: `fetchOrdersByAccount`, `fetchOrderHistory`
- [ ] Selectors: `selectOrdersByAccount`, `selectActiveOrders`, `selectOrderHistory`
- [ ] Optional: `fills` slice for granular fill tracking

**Services Layer:**
- [ ] Create `OrderDataService` using StoreService
- [ ] Methods: `getOrdersByAccount`, `getActiveOrders`, `getOrderHistory`, `getOrderFills`
- [ ] All methods return `DataResult<T>`

**Integration:**
- [ ] Update `trading/di.ts` to include orders
- [ ] Export from `trading/src/orders/index.ts`
- [ ] Update `TradingThunkExtras` type
- [ ] Wire up services in client

**Testing:**
- [ ] Domain model tests
- [ ] Repository adapter tests
- [ ] Redux state tests (thunks, reducers, selectors)
- [ ] Service tests with mock store

**Acceptance Criteria:**
- ✅ All tests passing
- ✅ Services return DataResult<T>
- ✅ Follows same pattern as Markets/Positions
- ✅ Integrated into `client.trading.orders`

**Related User Stories:**
- **STAR-107**: Open Long Position - needs order placement
- **STAR-108**: Open Short Position - needs order placement
- **STAR-110**: Close Positions - needs order management
- **STAR-113**: View Trading History - needs order/fill history

---

### Task 4: Implement Funding Subdomain
**Priority:** MEDIUM
**Story Points:** 5-7 (estimated 3-4 hours)
**User Stories:** STAR-109 (position details), STAR-127 (analytics)
**Location:** `fuel-ts-sdk/src/trading/src/funding/`

**Prerequisites:**
- Indexer tracks funding rate updates
- GraphQL schema includes funding rate queries

**Implementation Checklist:**

**Domain Layer:**
- [ ] Create `FundingRate` model (market, rate, timestamp, next funding time)
- [ ] Create `FundingPayment` model (position key, payment amount, timestamp)
- [ ] Define Zod schemas

**Adapter Layer:**
- [ ] GraphQL operations: `getFundingRates`, `getFundingHistory`
- [ ] Create `FundingRepository` port
- [ ] Implement `GraphQLFundingRepository`

**State Layer:**
- [ ] Create `funding-rates` slice: `LoadableState<Record<AssetId, FundingRate>>`
- [ ] Thunks: `fetchFundingRates`
- [ ] Selectors: `selectFundingRate`, `selectAllFundingRates`
- [ ] Optional: `funding-payments` slice

**Services Layer:**
- [ ] Create `FundingDataService`
- [ ] Methods: `getFundingRate`, `getFundingPayments`
- [ ] Pure calculation helpers:
  - `calculateNextFundingPayment(position, fundingRate)`
  - `calculateAccruedFunding(position, currentRate)`

**Integration:**
- [ ] Update `trading/di.ts`
- [ ] Export from `trading/src/funding/index.ts`
- [ ] Update `TradingThunkExtras`
- [ ] Wire up in client

**Testing:**
- [ ] Domain tests
- [ ] Repository tests
- [ ] State management tests
- [ ] Calculation function tests

**Acceptance Criteria:**
- ✅ Funding rates accessible via services
- ✅ Calculations integrate with position metrics
- ✅ Tests passing
- ✅ Follows established patterns

---

### Task 5: Frontend Integration (SDK Consumer)
**Priority:** HIGH
**Story Points:** 13-21 (not SDK work, listed for context)
**User Stories:** STAR-123, STAR-126, STAR-127
**Location:** `src/@starboard/trading/`

**SDK Consumption Pattern:**
```typescript
// Frontend setup
import { createStarboardClient } from 'fuel-ts-sdk';
import type { Position, Order, DataResult } from 'fuel-ts-sdk';
import { PositionSide, OrderStatus } from 'fuel-ts-sdk';

const client = createStarboardClient({ indexerUrl: process.env.INDEXER_URL });

// Redux Provider setup
<Provider store={client.store}>
  <App />
</Provider>

// Fetch data via thunks
const dispatch = useAppDispatch();
useEffect(() => {
  dispatch(fetchPositionsByAccount(account));
  dispatch(fetchOrdersByAccount(account));
  dispatch(fetchOraclePrices(marketAssets));
}, [account, dispatch]);

// Access via services with status handling
const positionsResult = client.trading.positions.positionDataService
  .getPositionsByAccount(account);

if (positionsResult.status === 'pending') return <Spinner />;
if (positionsResult.status === 'rejected') return <Error error={positionsResult.error} />;
if (positionsResult.status === 'fulfilled') {
  const positions = positionsResult.data;
  // Render positions
}

// Use pure calculation functions
const metrics = client.trading.portfolio.calculatePortfolioMetrics(
  positions, collateralBalance, oraclePrices, usedMargin
);
```

**Frontend Deliverables (not SDK scope):**
- Trading forms (PositionForm.tsx)
- Positions table (PositionsTable.tsx)
- Order management UI
- Market selector and stats
- P&L charts
- Trading history view

---

### Task 6: GraphQL Subscriptions (Future)
**Priority:** LOW (deferred until backend ready)
**Story Points:** 3-5
**Location:** All subdomains (add subscriptions to existing repositories)

**Planned Approach:**
- Add subscription methods to repositories
- Subscriptions dispatch to existing Redux actions
- State updates trigger service re-computation
- No architectural changes needed (already designed for this)

**Example Pattern:**
```typescript
// markets/adapter/operations/subscribe-oracle-prices.ts
export const subscribeToOraclePrices = createAsyncThunk(
  'markets/subscribeToOraclePrices',
  async (assetIds: AssetId[], { dispatch, extra }) => {
    const subscription = extra.marketRepository.subscribeToOraclePrices(assetIds);
    subscription.on('data', (update) => {
      dispatch(oraclePricesActions.updateOraclePrice(update));
    });
  }
);
```

---

## Other Domains (Outside Trading)

### Liquidity Domain (Top-Level)
**Location:** `fuel-ts-sdk/src/liquidity/`
**Story Points:** ~30-40
**User Stories:** STAR-115, STAR-116, STAR-117

**Scope:**
- LP position management
- Pool state queries
- Fee distribution calculations
- Similar full-stack structure as Trading

### Account/Collateral Domain (Top-Level)
**Location:** `fuel-ts-sdk/src/account/`
**Story Points:** ~20-25
**User Stories:** STAR-112, STAR-114

**Scope:**
- Wallet integration helpers
- Balance queries (native + ERC20)
- Collateral deposit/withdrawal
- Account dashboard aggregations

---

## Out of Scope (Confirmed Not Needed)

### ❌ Not Implementing:
- **Subaccount aggregation** - Not in current scope
- **Cross/Isolated margin modes** - Contracts don't specify yet
- **Complex caching** - Frontend handles with React Query
- **Migration guide** - Internal SDK
- **Extensive documentation** - Code is self-documenting with types

---

## Architecture Patterns (Reference)

### Data Flow
```
Fuel Blockchain → Indexer (Subsquid) → GraphQL API → SDK Repositories
                                                           ↓
                                              Redux State (via thunks)
                                                           ↓
                                              Services (StoreService)
                                                           ↓
                                              Frontend (React + Redux Provider)
```

### Module Structure (Subdomain Template)
```
subdomain/
├── domain/              # Models, schemas, enums
├── adapter/             # GraphQL operations, repository implementation
│   └── operations/
├── services/            # Business logic with StoreService
├── state/               # Redux slices
│   └── slice-name/
│       ├── slice.ts
│       ├── thunks.ts
│       ├── selectors.ts
│       ├── actions.ts
│       ├── types.ts
│       └── index.ts
├── port.ts              # Repository interface
└── index.ts             # Public API (types, factories)
```

### Design Patterns
- **Domain-Driven Design**: Clear subdomain boundaries
- **Hexagonal Architecture**: Ports & Adapters for repositories
- **Redux with DI**: Thunk extras for repository injection
- **Service Layer**: StoreService abstracts Redux complexity
- **Type Safety**: Zod schemas + TypeScript + branded types
- **Decimal Precision**: Custom DecimalValue types for financial math
- **Status-Aware Services**: `DataResult<T>` forces exhaustive handling

---

## Testing Strategy

### Current Approach
- Mock Redux store state for service tests
- Mock GraphQL responses for repository tests
- Test calculations with known fixture values
- Test edge cases (zero equity, missing data, errors)

### Test Files Structure
```
trading/tests/
├── markets/
│   └── markets-repository.test.ts  (needs update)
├── positions/
│   ├── position-metrics.test.ts    (needs update)
│   └── risk.test.ts                (needs update)
└── cross-domain/
    └── portfolio/
        └── portfolio-metrics.test.ts (needs creation)
```

---

## References

- [domain-ownership.md](../arch/domain-ownership.md) - Full domain model and team structure
- [DOMAINS.md](./DOMAINS.md) - SDK domain architecture
- Redux state structure: `state.trading.markets.oraclePrices`, `state.trading.positions`
- Cross-domain analytics: `src/cross-domain/portfolio/`
