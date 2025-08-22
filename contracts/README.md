# Starboard Contracts

## Overview

Trading on Starboard is supported by multi-asset pools that earns liquidity providers fees from market-making, swap fees, and leveraged trading.

The main components of the protocol are:

### 1. Vault

`Vault` is the core contract that handles all trading and liquidity operations. It acts as a peer-to-pool system where users trade against a pool of assets rather than directly with other users. The contract manages:

-   Pooled assets from liquidity providers
-   Opening/closing of leveraged long/short positions
-   Minting/burning of the RUSD stablecoin
-   Liquidations and funding rates
-   Swap functionality between supported assets

The Vault maintains solvency by ensuring the value of all assets in the pool exceeds the sum of all user deposits and profits. Position collateral is held in the Vault, and liquidations occur automatically when positions become undercollateralized.

### 2. RLP

`RLP` is the liquidity provider asset on the platform, and can be minted using any of the approved assets within the `Vault` pool such as `$ETH`, `$USDC`, and `$BTC`.

The price of RLP is pegged to the worth of all underlying assets within the `Vault`, factoring in profits and losses of all active positions.

### 3. Pricefeeds

`VaultPriceFeed` handles querying and updating of prices from the Pyth network for all assets within the `Vault` pool.


## Testing

```bash
pnpm i

pip install caer

# Build + Generate Types
pnpm build
pnpm gen:types

# --------- Testing ---------

### Run local Fuel Node
fuel-core run --snapshot ./chain-config --debug --db-type in-memory --graphql-max-complexity 200000000

### Ze tests
pnpm test
```

# License

All code in this repository is protected under the Apache-2.0 License.
