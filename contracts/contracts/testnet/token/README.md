# SRC20 Token Implementation

This is a basic implementation of an SRC20 token contract that complies with both SRC20 (native asset standard) and SRC3 (mint/burn standard) specifications, following the Fuel native asset pattern.

## Features

- **SRC20 Compliance**: Implements the standard SRC20 interface for native assets
- **SRC3 Compliance**: Implements mint and burn functionality
- **Native Asset Pattern**: Uses Fuel's native asset system instead of ERC20-style balances
- **Standard Token Functions**: Name, symbol, decimals, total supply
- **Mint/Burn**: Create and destroy tokens with proper supply tracking

## Contract Structure

```
src/
├── main.sw              # Main contract implementation
├── errors.sw            # Error definitions
└── fungible_abi.sw      # FungibleAsset trait definition
```

## Usage

### Initialization

The contract must be initialized once with:
- `name`: Token name (e.g., "My Token")
- `symbol`: Token symbol (e.g., "MTK")
- `decimals`: Number of decimal places (default: 18)

### Core Functions

#### SRC20 Functions
- `name()` → Returns token name
- `symbol()` → Returns token symbol
- `decimals()` → Returns number of decimals
- `total_supply()` → Returns total token supply

#### SRC3 Functions
- `mint(recipient, amount)` → Mints new tokens to specified address
- `burn(amount)` → Burns tokens from caller's balance

#### Utility Functions
- `get_asset_id()` → Returns the asset ID for this token

## Key Differences from ERC20

- **No Manual Balance Tracking**: Uses Fuel's native asset system
- **No Transfer Functions**: Transfers are handled automatically by Fuel
- **No Allowance System**: Not needed in Fuel's native asset model
- **Simpler Implementation**: Focuses on mint/burn and metadata

## Dependencies

- `src20`: SRC20 standard implementation
- `src3`: SRC3 standard implementation

## Building

```bash
cd contracts/testnet/token
forc build
```

## Testing

```bash
forc test
```

## License

Apache-2.0
