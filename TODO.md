# Starboard SDK Development TODO

## Immediate Tasks

### Architecture Review
- [ ] Review Candles module domain fit
  - Is it part of Trading or should it be standalone?
  - Does it belong in Markets subdomain?
- [ ] Review CurrentPrices module domain fit
  - Overlap with oracle prices?
  - Should merge with Markets/OraclePrices?
- [ ] Review Prices module domain fit
  - Historical vs real-time separation
  - Domain ownership clarity

### State Management Migration
- [ ] Migrate Candles to Commands/Queries pattern
  - Add Redux state slice
  - Create public/commands/candles.commands.ts
  - Create public/queries.ts with selectors
  - Wire into trading DI
- [ ] Migrate CurrentPrices to Commands/Queries pattern
  - Add Redux state slice
  - Create public/commands/current-prices.commands.ts
  - Create public/queries.ts with selectors
  - Wire into trading DI
- [ ] Migrate Prices to Commands/Queries pattern
  - Add Redux state slice
  - Create public/commands/prices.commands.ts
  - Create public/queries.ts with selectors
  - Wire into trading DI

## Critical Missing Modules (For Trading Frontend)

### Orders Module (High Priority)
- [ ] Design Orders subdomain
  - Order domain models (Order, OrderType, OrderStatus)
  - Order repository port and GraphQL adapter
  - Order state management (Redux)
  - Commands: placeOrder, cancelOrder, modifyOrder
  - Queries: selectOpenOrders, selectOrderHistory, selectOrderById
- [ ] Add to Trading module DI
- [ ] Export via fuel-ts-sdk/trading

### Account Module (High Priority)
- [ ] Design Account domain
  - Wallet connection state
  - Balance queries (USDC collateral)
  - Available margin calculations
  - Network configuration (testnet/mainnet)
- [ ] Account repository and adapters
- [ ] Account state management
- [ ] Commands: connectWallet, disconnectWallet, fetchBalances
- [ ] Queries: selectBalance, selectAvailableMargin, selectWalletAddress

### OrderBook Data (Medium Priority)
- [ ] Determine source: indexer or direct from contracts?
- [ ] Design OrderBook domain if needed
- [ ] Real-time depth updates strategy

## Frontend Readiness

### Currently Possible ✅
- Market overview (prices, charts)
- Position monitoring dashboard
- P&L tracking and analytics
- Historical data visualization

### Blocked Until Complete ❌
- Order entry panel (needs Orders module)
- Trading execution (needs Account + Orders)
- Order management UI (needs Orders module)
- Real-time trading (needs WebSocket/SSE strategy)

## Domain Architecture Validation

### Questions to Answer
1. Should Candles/Prices be in Trading or separate Market Data domain?
2. Is CurrentPrices redundant with OraclePrices?
3. Do we need historical Prices if we have Candles?
4. Where does Funding domain fit? (mentioned in DOMAINS.md but not implemented)

## Post-MVP Features
- [ ] Liquidity domain (LP positions, RLP tokens, fee distribution)
- [ ] Advanced analytics and reporting
- [ ] Historical data exports
- [ ] Performance metrics tracking

---

**Last Updated:** 2025-12-27
