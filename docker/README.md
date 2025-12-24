# Starboard Docker Setup

## Quick Start

```bash
cd docker
docker-compose up -d --build
```

That's it! All services will start with proper Docker practices.

## File Structure

```text
starboard/
├── .dockerignore                    # Optimizes Docker build context
└── docker/
    ├── docker-compose.yml           # Main compose configuration
    ├── Makefile                     # Convenient commands
    ├── README.md                    # This file
    ├── fuel-core/
    │   └── Dockerfile               # Fuel node image
    └── starboard/
        ├── Dockerfile               # Main application image (COPY-based)
        └── setup_starboard_contracts.sh
```

## The Dockerfile

**Location:** `docker/starboard/Dockerfile`

This uses **standard Docker practices**:

- ✅ `COPY . .` from local filesystem
- ✅ No git operations
- ✅ Works same in dev and CI/CD
- ✅ Fast builds with layer caching

### Build Context

```yaml
# docker-compose.yml
services:
  indexer:
    build:
      context: .. # Repo root (starboard/)
      dockerfile: docker/starboard/Dockerfile # This Dockerfile
```

**How it works:**

1. Build context = `starboard/` (repo root)
2. Dockerfile = `docker/starboard/Dockerfile`
3. `COPY . .` copies entire repo into image
4. No git clone needed!

## Services

| Service   | Container                   | Port  | Description                |
| --------- | --------------------------- | ----- | -------------------------- |
| fuel-core | starboard_fuel_core         | 4000  | Local Fuel blockchain node |
| db        | starboard_indexer_db        | 23751 | PostgreSQL database        |
| indexer   | starboard_indexer_processor | -     | Indexes blockchain events  |
| api       | starboard_indexer_api       | 4350  | GraphQL API                |

## Commands

### Using docker-compose

```bash
# Start everything
docker-compose up -d --build

# View logs
docker-compose logs -f indexer

# Stop everything
docker-compose down

# Full reset (removes volumes)
docker-compose down -v

# Rebuild a specific service
docker-compose build indexer
docker-compose restart indexer
```

### Using Makefile

```bash
# Show all commands
make help

# Initial setup
make setup

# Common operations
make up          # Start services
make down        # Stop services
make logs        # View all logs
make logs-indexer # View indexer logs
make status      # Check status
make health      # Check health
make restart     # Restart all
make rebuild     # Full rebuild

# Asset management (after setup)
make deploy-contracts  # Deploy contracts to local node
make mint-usdc         # Mint USDC to User0 (default)
make mint-usdc-user1   # Mint USDC to User1
make feed-prices       # Update oracle prices from Pyth

# Testing
make test        # Test all services
make test-api    # Test GraphQL API only
make test-fuel   # Test fuel-core only
```

## Environment Variables

Configuration is in `docker/.env.docker` - **committed to the repo with test-only values for local development.**

All services reference this file via `env_file: - .env.docker` in `docker-compose.yml`.

You can edit `.env.docker` directly if you need custom values.

Key variables in `.env.docker`:

```bash
# Fuel Core
FUEL_CORE_PORT=4000              # Port for Fuel node
MIN_GAS_PRICE=1                  # Minimum gas price
CONSENSUS_KEY_SECRET=0xa449b...  # Consensus key

# Database
DB_NAME=postgres
DB_USER=postgres
DB_PASS=postgres
DB_PORT=23751                    # External port mapping

# Indexer API
GQL_PORT=4350                    # GraphQL API port

# Indexer Mode
GATEWAY_URL=                     # Empty = local mode
GRAPHQL_URL=http://starboard_fuel_core:4000/v1/graphql
FROM_BLOCK=0                     # Start indexing from block 0

# Contract Addresses (deterministic - same every deployment)
VAULT_PRICEFEED_ADDRESS=0x422729Dc06fD5811ec48eDf38915a52aa6383B3a2e91a7f45F1eECaAba2aEf81
VAULT_ADDRESS=0x926db3Ae7909265BcAb347F45F59826FCF259Be9F915881e9Ef7D07cE29df51c
USDC_ADDRESS=0x9534954321965C4B2dC45712AC3e7B575AFD43C38d2c9834bb5232f5F2BF2c6E
```

To customize for your local environment, just edit `docker/.env.docker` directly.

## Indexer Modes

### Local Development (Default)

```bash
GATEWAY_URL=               # Empty
GRAPHQL_URL=http://starboard_fuel_core:4000/v1/graphql
```

The indexer fetches directly from local fuel-core.

### Testnet

```bash
GATEWAY_URL=https://v2.archive.subsquid.io/network/fuel-testnet
GRAPHQL_URL=https://testnet.fuel.network/v1/graphql
```

### Mainnet

```bash
GATEWAY_URL=https://v2.archive.subsquid.io/network/fuel-mainnet
GRAPHQL_URL=https://mainnet.fuel.network/v1/graphql
```

## Contract Addresses & Test Accounts

### Deployed Contract Addresses

These addresses are **deterministic** - every clean deployment yields the same addresses:

```bash
# Vault contracts
VAULT_ADDRESS=0x926db3Ae7909265BcAb347F45F59826FCF259Be9F915881e9Ef7D07cE29df51c
VAULT_PRICEFEED_ADDRESS=0x422729Dc06fD5811ec48eDf38915a52aa6383B3a2e91a7f45F1eECaAba2aEf81

# Test token
USDC_ADDRESS=0x9534954321965C4B2dC45712AC3e7B575AFD43C38d2c9834bb5232f5F2BF2c6E
USDC_ASSET_ID=0xda81350458510a2b4adfb85032ad319a61f271e9ccabe702c96696efc72bc6de

# Mock oracle
STORK_MOCK_ADDRESS=0x422729Dc06fD5811ec48eDf38915a52aa6383B3a2e91a7f45F1eECaAba2aEf81
PRICEFEED_WRAPPER=0x212EB3F8Ff08392B2aa030768A3814fc5A0a67F94412CfE07e37DD1cbC24F9D6
```

### Prefunded Test Accounts

The local fuel node includes these prefunded accounts for testing:

| Role            | Private Key                                                          | Address                                                              |
| --------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Deployer**    | `0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a` | `0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6` |
| **User0**       | `0x366079294383ed426ef94b9e86a8e448876a92c1ead9bbf75e6e205a6f4f570d` | `0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770` |
| **User1**       | `0xb978aa71a1487dc9c1f996493af73f0427cf78f560b606224e7f0089bae04c41` | `0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c` |
| **Liquidator**  | `0xa5675fc7eb0657940fc73f6ec6c5265c045065ddac62e12e1174da030f3868b3` | `0xad000576cc6dc12183a0306d8809c24f897fbbccfd3f179c571db6659218c088` |
| **PriceSigner** | `0xb19556cb693d7850d0e75d05a6e2e4c9ed5691d9e5bc54a7d43ee6eed3ad5fe3` | `0x6fe2a2b3a6f712b211c7317cf0fd12805d10f4f5473cfb461b1e2ba7acaf790b` |

⚠️ **WARNING:** These are test keys for local development only. Never use with real funds!

### Minting Test USDC

Quick commands using Make:

```bash
# Mint to default test account (User0)
make mint-usdc

# Mint to User1
make mint-usdc-user1

# Mint to custom account
make mint-usdc-custom PRIV_K=0x...
```

Or using docker directly:

```bash
# Replace USER_PRIVATE_KEY with one of the test accounts above
docker exec -t -e PRIV_K=USER_PRIVATE_KEY --env-file .env.docker starboard_indexer_processor \
  bash -i -c "pnpm --filter starboard/contracts faucet \
    --url=http://starboard_fuel_core:4000/v1/graphql \
    --privK=\${PRIV_K} \
    --token=\${USDC_ADDRESS}"
```

Each mint command mints 1M USDC to the specified account.

### Feeding Prices from Pyth Oracle

Quick command using Make:

```bash
make feed-prices
```

Or using docker directly:

```bash
docker exec -t --env-file .env.docker starboard_indexer_processor \
  bash -i -c "pnpm --filter starboard/contracts prices:feed \
    --url=http://starboard_fuel_core:4000/v1/graphql \
    --priceSignerPrivK=0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a \
    --mockPricefeedAddress=\${VAULT_PRICEFEED_ADDRESS}"
```

### Connecting Fuel Wallet

To use the Fuel browser wallet extension with your local setup:

1. Open Fuel Wallet extension
2. Add new network:
   - **URL:** `http://localhost:4000/v1/graphql`
   - **Chain ID:** `0`
3. Import one of the test accounts above using the private key

## Testing

```bash
# Test Fuel Core
curl http://localhost:4000/v1/health

# Test GraphQL API
curl -X POST http://localhost:4350/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { queryType { name } } }"}'

# Check indexer config
docker logs starboard_indexer_processor | grep "Starboard Indexer Configuration" -A 5
```

## Development Workflow

### Making Code Changes

```bash
# 1. Edit code
vim ../indexer/src/main.ts

# 2. Rebuild (uses local changes via COPY)
docker-compose build indexer

# 3. Restart
docker-compose restart indexer

# 4. Check logs
docker-compose logs -f indexer
```

The Dockerfile uses `COPY . .` so it always builds from your current local code.

## CI/CD Integration

The same setup works in CI/CD:

```yaml
# Example GitHub Actions
- name: Checkout code
  uses: actions/checkout@v3

- name: Build
  run: |
    cd docker
    docker-compose build
```

No special configuration needed!

## Why This Structure?

### Dockerfile Location

**Why `docker/starboard/Dockerfile` instead of root?**

1. **Organization**: Keeps Docker files together
2. **Clean root**: Doesn't clutter repo root
3. **Multiple Dockerfiles**: Easy to have fuel-core, starboard, etc.
4. **Still standard**: Build context is repo root (standard practice)

### Build Context

**Why context is `..` (repo root)?**

The build context is still the repository root, which is standard. Only the Dockerfile location is in a subdirectory. This is a common pattern:

```
context: ..              # Build from repo root ✅
dockerfile: docker/starboard/Dockerfile  # But Dockerfile is organized in subdir
```

This gives us:

- ✅ Standard build context (repo root)
- ✅ Organized Dockerfile location
- ✅ Clean repository structure

```yaml
context: .. # Build from repo root ✅
dockerfile: docker/starboard/Dockerfile # But Dockerfile is organized in subdir
```

## Troubleshooting

### Build fails

```bash
# Check context and dockerfile paths
cd docker
docker-compose build --no-cache indexer
```

### Service unhealthy

```bash
# Check logs
docker-compose logs <service_name>

# Check status
docker-compose ps
```

### Port conflicts

Edit `docker/.env.docker` to change ports:

```bash
FUEL_CORE_PORT=4001
GQL_PORT=4351
DB_PORT=23752
```

## Documentation

- `PROPER_DOCKER_PRACTICES.md` - Why we use COPY not git clone
- `ARCHITECTURE.md` - Visual explanations
- `FINAL_SETUP.md` - Complete verified setup
- `Makefile` - Run `make help` to see all commands

## Support

For issues:

1. Check logs: `docker-compose logs <service>`
2. Verify .env exists: `ls .env`
3. Test endpoints (see Testing section above)
4. Review documentation in this directory
