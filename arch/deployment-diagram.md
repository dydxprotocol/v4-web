# Starboard Finance Deployment Architecture

## Architecture Overview

This diagram shows the deployment architecture for the Starboard Finance first deliverable, including the modified ruscet contracts on Fuel mainnet, the forked dYdX frontend, and the custom subsquid indexer.

```mermaid
graph TB
    subgraph "User Layer"
        U1[Traders]
        U2[Funding Rate Arbitragers]
        U3[Liquidity Providers]
    end

    subgraph "Frontend Layer"
        W1[Starboard Web App<br/>Modified dYdX Frontend]
        W2[Worldchain Mini App<br/>Simple Trading UI]
        SC_CLIENT[Starboard Client<br/>API & Contract Interface]
        FC[Fuel Connectors<br/>Fuel Wallets & EVM Wallets]
    end

    subgraph "API & Data Layer"
        IDX[Subsquid Indexer<br/>GraphQL & REST API<br/>dYdX Compatible]
    end

    subgraph "Fuel Network"
        subgraph "Smart Contracts"
            SC[Starboard Contracts]
            OR[Stork Oracles<br/>ETH, BTC, FUEL, stFUEL]
        end
        
        subgraph "Assets"
            A1[USDC<br/>Vault Asset & Collateral]
            A2[RLP Tokens<br/>LP Position Asset]
        end
    end

    subgraph "External Services"
        STORK[Stork Network<br/>Price Feeds]
        BE[Block Explorer<br/>Fuel Network]
    end

    %% User interactions
    U1 --> W1
    U2 --> W1
    U3 --> W1
    U1 --> W2
    
    %% Frontend to client connections
    W1 --> SC_CLIENT
    W2 --> SC_CLIENT
    
    %% Client to connectors
    SC_CLIENT --> FC
    
    %% Client to data layer
    SC_CLIENT --> IDX
    
    %% Connector to network
    FC --> SC
    FC --> OR
    FC --> A1
    FC --> A2
    
    %% Indexer to contracts
    IDX --> SC
    
    %% Contract interactions
    SC --> OR
    OR --> STORK
    SC --> A1
    SC --> A2
    
    %% External services
    W1 --> BE

    %% Styling
    classDef userClass fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef frontendClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef clientClass fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px
    classDef connectorClass fill:#fff3e0,stroke:#ff6f00,stroke-width:2px
    classDef dataClass fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef contractClass fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef assetClass fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef externalClass fill:#f1f8e9,stroke:#33691e,stroke-width:2px

    class U1,U2,U3 userClass
    class W1,W2 frontendClass
    class SC_CLIENT clientClass
    class FC connectorClass
    class IDX dataClass
    class SC,OR contractClass
    class A1,A2 assetClass
    class STORK,BE externalClass
```

## Component Details

### Frontend Layer
- **Starboard Web App**: Modified dYdX frontend with new branding and Fuel network integration
- **Worldchain Mini App**: Simplified trading interface for the Worldchain mini app store
- **Starboard Client**: Central interface layer that handles all API calls to the data layer and smart contract interactions via fuel-ts-sdk
- **Fuel Connectors**: Handles both Fuel wallets and EVM wallets, providing unified wallet interface

### Data & API Layer
- **Subsquid Indexer**: Single service that processes Fuel network events and provides both GraphQL and REST APIs with dYdX compatibility

### Fuel Network Layer
- **Starboard Contracts**: Updated contracts with USDC-only deposits, no RUSD, RLP positions, and configurable fees (deployed on both mainnet and testnet environments)
- **Stork Oracles**: Price feed integration for supported assets (ETH, BTC, FUEL, stFUEL)
- **Assets**: USDC as primary asset and RLP tokens for liquidity provider positions

### Key Architecture Changes from Original dYdX
1. **Blockchain**: Migrated from Cosmos to Fuel Network
2. **Asset Strategy**: USDC-only vault and collateral system
3. **LP Tokens**: RLP tokens instead of RUSD for liquidity positions
4. **Oracles**: Stork integration for expanded asset coverage
5. **Indexer**: Custom subsquid indexer replacing dYdX's native indexing
6. **Wallet Integration**: Unified Fuel connectors handling both Fuel and EVM wallets

## Data Flow
1. Users interact through web app or mini app
2. Frontend applications route all requests through the Starboard Client
3. Starboard Client handles API calls to the subsquid indexer for read operations
4. Starboard Client manages wallet connections via Fuel connectors for write operations
5. Fuel connectors handle both Fuel wallets and EVM wallets (Worldchain) as unified interface
6. Write operations go through Starboard Client → Fuel connectors → Starboard contracts via fuel-ts-sdk
7. Indexer monitors contract events and updates database
8. Oracles provide real-time price data to contracts
