# Starboard Finance Domain Model

> **Note**: This document defines the SDK domain architecture. It remains stable across implementation phases and does not track progress status.

---

## Core Domains

### 1. Trading
**Responsibility**: Position management, order execution, market data, funding costs

**Subdomains:**
- **Positions** - Open/close/modify positions, track real-time P&L, liquidations
- **Orders** - Market/limit orders, order execution, trade history
- **Markets** - Market configurations, asset listings, oracle price feeds
- **Funding** - Funding rate data, payment tracking (contracts calculate, SDK displays)

**Key User Stories**: STAR-107, STAR-108, STAR-109, STAR-110, STAR-111, STAR-113, STAR-114, STAR-119

**Aggregates**: `Position`, `Order`, `MarketConfig`, `OraclePrice`, `FundingRate`, `FundingPayment`

**SDK Location**: `fuel-ts-sdk/src/trading/`

---

### 2. Liquidity
**Responsibility**: LP token management, pool operations, fee distribution

**Subdomains:**
- **Pool** - Add/remove liquidity, pool reserves, utilization tracking
- **Fees** - Trading fee distribution, LP earnings tracking

**Key User Stories**: STAR-115, STAR-116, STAR-117

**Aggregates**: `LiquidityPool`, `LPPosition`, `RLPToken`

**SDK Location**: `fuel-ts-sdk/src/liquidity/` _(future)_

---

### 3. Account
**Responsibility**: Wallet connection, balance queries, network management

**Subdomains:**
- **Wallet** - Fuel wallet connectors, connection state
- **Balances** - USDC collateral queries, margin calculations
- **Network** - Testnet/mainnet switching, configuration

**Key User Stories**: STAR-106, STAR-112, STAR-120

**Aggregates**: `WalletConnection`, `Balance`, `NetworkConfig`

**SDK Location**: `fuel-ts-sdk/src/account/` _(future)_

---

## Cross-Domain Concerns

### Portfolio Analytics
**Location**: `fuel-ts-sdk/src/cross-domain/portfolio/`

**Responsibility**: Aggregate metrics across Trading + Liquidity + Account

**Pure Calculation Functions**:
- `calculateAccountEquity()` - Collateral + unrealized P&L
- `calculateTotalNotional()` - Sum of position notionals
- `calculateAccountLeverage()` - Portfolio-level leverage
- `calculateMarginUsage()` - Margin utilization percentage
- `calculatePortfolioMetrics()` - Complete portfolio snapshot

**Data Sources**: Trading positions, Account balances, Funding costs

**Used By**: STAR-109 (positions view), STAR-113 (history), STAR-117 (LP analytics), STAR-127 (performance tracking)

---

## Domain Ownership & Boundaries

### Trading Domain Owns:
- Position lifecycle (open → close/liquidate)
- Order state (pending → filled/cancelled)
- Market parameters (tick size, margin requirements)
- Oracle price integration
- Funding rate display (calculated by contracts)

### Liquidity Domain Owns:
- RLP token minting/burning logic
- Pool value calculations
- Fee accumulation and distribution
- LP position tracking

### Account Domain Owns:
- Wallet connection state management
- USDC balance queries (from chain)
- Network configuration (testnet/mainnet)
- User session management

---

## Shared Types (Cross-Domain)

**Primitive Types**:
- `Address` - Fuel blockchain address
- `AssetId` - Asset identifiers (ETH, BTC, FUEL, stFUEL)
- `PositionId` - Unique position identifier

**Value Types**:
- `UsdValue` - USD-denominated amounts
- `PercentageValue` - Percentage calculations (fees, margins, rates)
- `OraclePrice` - Price feed values
- `CollateralAmount` - Collateral quantities
- `PositionSize` - Position size values

**Shared Location**: `fuel-ts-sdk/src/shared/`

---

## Cross-Domain Relationships

### Portfolio Analytics aggregates:
- **Trading**: Positions (unrealized P&L), Orders (trade history)
- **Account**: Collateral balances (USDC)
- **Funding**: Payment costs over time

### Funding Rates affect:
- **Trading**: Position P&L calculations, holding costs
- **Portfolio**: Total account performance metrics

### Liquidity Pool impacts:
- **Trading**: Maximum position sizes, available capacity
- **Account**: Collateral availability

---

## Architecture Principles

### 1. Domain Independence
Each domain is self-contained with clear interfaces. Domains communicate through well-defined contracts, never direct dependencies.

### 2. Pure Functions for Cross-Domain Logic
Cross-domain calculations (like Portfolio Analytics) are pure functions. They aggregate data from multiple domains without introducing coupling.

### 3. Redux State per Subdomain
Each subdomain manages its own Redux slice(s). Trading domain composes: positions + orders + markets + funding slices.

### 4. Services Return DataResult<T>
All service methods return status-aware results:
- `{ status: 'idle' }` - Not yet fetched
- `{ status: 'pending' }` - Loading
- `{ status: 'fulfilled', data: T }` - Success
- `{ status: 'rejected', error: string }` - Error

This forces exhaustive handling at call sites.

### 5. Repository Pattern for Data Access
Each subdomain has a Repository port with GraphQL adapter implementation. This abstracts data source from business logic.

---

## Domain Model Scope

### MVP Scope (Sept 9th):
- **Trading** domain (Positions, Orders, Markets, Funding rates display)
- **Account** domain (Wallet connection, USDC balances, network switching)
- **Portfolio** analytics (cross-domain calculations)

### Post-MVP:
- **Liquidity** domain (LP positions, RLP tokens, fee distribution)
- Advanced analytics and reporting
- Historical data exports

---

## SDK vs Frontend Boundaries

### SDK Layer (`fuel-ts-sdk/`):
- Domain models and business logic
- Redux state management (slices, thunks, selectors)
- GraphQL repositories and adapters
- Pure calculation functions
- **No React dependencies**

### Frontend Layer (`src/`):
- React components and UI
- Bonsai abstraction (hooks, effects)
- Fuel wallet integration (connectors)
- TradingView charts
- Application-specific state

**Clear Separation**: Frontend consumes SDK, never the reverse.
