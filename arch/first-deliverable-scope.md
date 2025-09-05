## Starboard Finance First Deliverable

### Overall summary
Deploy modified ruscet contracts to mainnet allowing for long and short positions to be taken on crypto assets (ETH, BTC, FUEL, stFUEL). 
Deploy a forked version of the DYDX frontend with branding changes as a frontend for the newly deployed contracts. 
Allow for the shorting and longing of the given assets with X leverage (see open questions). 
Allow LPs to deposit funds into the liquidity pool and take part in both the gains and losses of the platform.

### User groups
- Traders
- Funding Rate arbitragers
- Liquidity Providers

### Stories

#### Traders
- **STAR-106**: As a trader, I want to view the current balance of my account so that I can understand my available collateral and make informed trading decisions
- **STAR-107**: As a trader, I want to open long positions on crypto assets (ETH, BTC, FUEL, stFUEL) with leverage so that I can amplify my gains on price increases
- **STAR-108**: As a trader, I want to open short positions on crypto assets (ETH, BTC, FUEL, stFUEL) with leverage so that I can profit from price decreases
- **STAR-109**: As a trader, I want to view my current positions, including size, leverage, PnL, and margin requirements
- **STAR-110**: As a trader, I want to close my positions partially or fully to realize profits or cut losses
- **STAR-111**: As a trader, I want to view real-time price charts and market data for the assets I'm trading
- **STAR-112**: As a trader, I want to connect my Fuel wallet to the platform to manage my trades
- **STAR-113**: As a trader, I want to see my trading history and performance metrics
- **STAR-118**: As a trader, I want to receive clear error messages when transactions fail or when I have insufficient collateral
- **STAR-119**: As a trader, I want to understand the funding fees I'll pay based on my position length and open interest imbalances
- **STAR-120**: As a trader, I want to select between testnet and mainnet so that I can test the platform before using it with real funds

#### Funding Rate Arbitragers
- **STAR-114**: As a funding rate arbitrager, I want to monitor funding rates across different time periods to identify arbitrage opportunities
- **STAR-119**: As a funding rate arbitrager, I want to track my funding rate income/costs across all my positions 
- **STAR-109**: As a funding rate arbitrager, I want to monitor my overall portfolio exposure and risk across multiple positions (via current positions view)
- Related to **STAR-107/STAR-108**: Quick position opening to capture favorable funding rate differentials
- Related to **STAR-114**: View open interest imbalances that affect funding rates

#### Liquidity Providers
- **STAR-115**: As a liquidity provider, I want to deposit USDC into the liquidity pool to earn fees from traders while taking proportional house risk through RLP tokens
- **STAR-116**: As a liquidity provider, I want to withdraw my USDC from the liquidity pool when needed by burning RLP tokens and receiving my proportional share
- **STAR-117**: As a liquidity provider, I want to view my earnings from trading fees and my exposure to trader profits/losses so that I can track my liquidity provision performance
- Related to **STAR-117**: See my share of the total liquidity pool and proportional ownership
- Related to **STAR-117**: Understand the risks I'm taking by providing liquidity (house risk from winning long positions)
- Related to **STAR-117**: Track my historical returns and performance as an LP
- Related to **STAR-117**: See the current utilization of the liquidity pool and overall platform metrics


### Contract changes
1. Take the ruscet contracts and make the following modifications
  a. Enable only USDC to be deposited into the vault as a vault asset (Prevents the use of the system as a swap platform)
  b. Allow only USDC to be deposited as collateral for both long and short positions 
    (Pro: Resolves issues with usd value creditation of collateral)
    (Con: Increases risk on house of winning long positions as collateral value increase is not captured by the protocol)
  c. Remove the use of RUSD as a lp position asset (Prefers only RLP positions that carry proportional house value/risk)
  d. Update to using newest version of forc
  e. Configure the position and funding fees to be paid relative position length and OI imbalances respectively
2. Update and improve testing coverage for tests
3. Deploy contracts to testnet
4. Deploy contracts to mainnet
5. Provision an audit for contract changes
6. Update oracles to use stork to gain access to steth pricing

### Frontend Changes
1. Modify frontend branding with the following
  a. New color palette
  b. New logos
  c. Update copy to reflect the fuel network and starboard rather than dydx (cosmos chain) and dydx platform
2. Update the frontend to use a custom Fuel client that does the following:
  a. Reads application state from the indexer
  b. Writes for the following actions to the fuel network via the fuel-ts-sdk: (CUD trader positions (long and short), CUD LP positions)
3. Update the frontend wallet to connect via the fuel connectors and to fetch address, and wallet funds from the fuel network
4. Processes and returns errors from the fuel network appropriately
5. Replace read calls in the custom client to use the sqd indexer rather than the dydx one
6. Modify the client reads that rely on webhooks to use the indexer graphql api instead

### Indexer
1. Create a new subsquid indexer that takes events from the starboard contracts and provides a dydx compliant
  a. Map out the differences between the Ruscet state model and the dydx state model
  b. Create an interface for the indexer that is close to compliant with the dydx indexer
  c. Write handlers that process the events and update indexer state to reflect the current state of the app

### Additional extension
1. Create a simple version of the UI for use in the worldchain mini app store
  a. This should allow simple long short bets with leverage with minimal clicks
  b. This should use the EVM connectors to allow for worldchain wallets to control user actions
  c. The user should be able to see trading history, current positions and price history

## Technical Stories

### Frontend
#### STAR-121: Frontend Project Scaffolding and Setup
- Fork DYDX frontend repository and rebrand with Starboard identity
- Set up new project structure with updated dependencies and configurations
- Configure Node.js development environment with hot reloading and debugging tools
- Set up environment variables and local API connections

#### STAR-122: Fuel Wallet Integration  
- Update the frontend wallet to connect via the fuel connectors
- Fetch address and wallet funds from the fuel network
- Handle wallet state management and account switching

#### STAR-123: Trading Interface
- Create Fuel-specific client library to replace DYDX client with fuel-ts-sdk
- Set up automated TypeScript generation from Sway contract ABIs
- Implement trading forms and position management interfaces

#### STAR-124: Transaction Management System
- Process and return errors from the fuel network appropriately 
- Create robust transaction handling with retry mechanisms
- Implement comprehensive error handling and user feedback

#### STAR-125: Data Integration via Polling
- Replace read calls in the custom client to use the indexer rather than the dydx one
- Modify client reads that rely on webhooks to use the indexer GraphQL API instead
- Set up polling for real-time data updates

#### STAR-126: Charts and Market Data
- Integrate TradingView charting library with market data
- Set up real-time price feeds and market statistics

#### STAR-127: Analytics and Performance Tracking
- Create analytics dashboards for trading and LP performance
- Implement portfolio tracking and performance metrics

#### STAR-138: CI/CD Pipeline Setup
- Configure linting, testing (Jest/Cypress), and code quality checks
- Set up automated deployment pipeline with staging/production environments

### Indexer (SubSquid)
#### STAR-134: Indexer Setup and Configuration
- Initialize SubSquid project with TypeScript and database schema for DYDX-compatible data models
- Set up logging, monitoring, and initial migration scripts
- Set up local PostgreSQL database and Fuel network node with Docker
- Configure debugging tools and document local development workflow

#### STAR-135: Event Processing and Data Models
- Map Ruscet contract events to DYDX data structures and create event handlers
- Design database schema with tables for positions, orders, accounts, and market data
- Process Starboard contract events and index blockchain data

#### STAR-136: GraphQL API with Data Transformation
- Configure GraphQL schema compatible with DYDX frontend expectations  
- Implement resolvers with real-time subscriptions, pagination, and rate limiting
- Create GraphQL API that provides most data transformation, while SDK client handles remaining manipulation

#### STAR-137: Data Polling Infrastructure
- Implement data polling infrastructure that combines RPC and indexer queries
- Set up efficient polling for real-time market data and account updates
- Configure performance monitoring for polling operations

#### STAR-138: CI/CD Pipeline Setup (Shared)
- Set up automated testing (unit/integration), linting, and deployment to SubSquid Cloud
- Configure monitoring, error tracking, and performance dashboards

### Contracts (Sway/Fuel)
#### STAR-128: Contract Setup and Deployment
- Fork Ruscet contracts repository and set up Sway project with latest Forc toolchain
- Configure workspace structure and update dependencies
- Configure local Fuel node with proper network settings and wallet management
- Create deployment scripts for testnet/mainnet with verification and monitoring

#### STAR-129: Position Management
- Implement increase_position and decrease_position functions with validation
- Add position liquidation mechanisms with fair pricing
- Configure margin and collateral calculations with safety margins

#### STAR-130: Funding Rate Mechanism  
- Implement funding rate calculations based on open interest imbalances
- Add funding rate storage and periodic updates (8-hour cycles)
- Create funding payment collection and distribution system

#### STAR-131: RLP Token System
- Create RLP token contract with standard token functionality
- Implement token minting for LP deposits and burning for withdrawals
- Add value calculation logic reflecting pool performance

#### STAR-132: Fee Configuration
- Design fee calculation framework with configurable parameters
- Implement position-length based fee calculations
- Add open interest imbalance fee adjustments

#### STAR-133: Oracle Integration
- Integrate Stork oracle interfaces for all supported assets (ETH, BTC, FUEL, stFUEL)
- Implement price feed validation and staleness checks
- Add fallback mechanisms for oracle failures

#### STAR-139: Infrastructure and Monitoring
- Set up comprehensive unit and integration test suites with coverage reporting
- Configure automated linting, testing, building, and ABI generation
- Set up security scanning and audit preparation

## Open questions
- How much leverage should be allowed for each asset?
- How will using rest endpoints for fetching real-time data effect the speed and responsiveness of the app


