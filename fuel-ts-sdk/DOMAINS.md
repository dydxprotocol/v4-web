# Starboard Domain Model

## Core Domains

### 1. Trading

Manage leveraged positions on perpetual markets

**Subdomains:**

- **Positions** Open/close positions, track PnL, liquidations
- **Orders** - Limit orders, stop loss, order book
- **Markets** - Market configuration, asset listings, trading parameters

**Aggregates:** `Position`, `Order`, `Market`

---

### 2. Liquidity

Manage liquidity pool and LP tokens (RLP)

**Subdomains:**

- **Pool** - Add/remove liquidity, pool reserves, utilization
- **Fees** - Trading fees, fee distribution to LPs

**Aggregates:** `LiquidityPool`, `LiquidityPosition`

---

### 3. Funding

Calculate and settle funding rates

**Subdomains:**

- **Calculation** - Interest rate, premium/discount calculation
- **Settlement** - Periodic payments between longs/shorts

**Aggregates:** `FundingRate`, `FundingSettlement`

---

### 4. Oracle

Provide price data for liquidations and PnL

**Subdomains:**

- **Prices** - Price feeds, aggregation, staleness checks
- **Liquidations** - Calculate thresholds, monitor positions

**Aggregates:** `PriceFeed`, `PriceUpdate`

---

### 5. Account

User accounts, balances, and permissions

**Subdomains:**

- **Accounts** - Account creation, metadata, permissions
- **Balances** - USDC collateral, available margin, locked collateral

**Aggregates:** `Account`, `Balance`

---

## Shared Types

- `Address` - Fuel blockchain address
- `AssetId` - Fuel asset identifier
- `BigNumber` - Large numeric values (bigint)
- `Timestamp` - Unix timestamp
