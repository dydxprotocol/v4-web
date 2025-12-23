# Starboard

A decentralized trading platform built on Fuel.

![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=fff)
![Monorepo](https://img.shields.io/badge/Monorepo-pnpm_workspaces-F69220)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![License](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

## Prerequisites

- Node.js v22+ (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- pnpm v8.6.6
- Docker (for running the indexer database)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/starboard.git
cd starboard
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the development servers

**Start the indexer:**
```bash
pnpm run dev:indexer
```

**Start the frontend:**
```bash
pnpm run dev
```

The frontend will be available at `http://localhost:5173`

## Monorepo Structure

```
starboard/
├── frontend/          # React + Vite SPA
├── indexer/           # Subsquid indexer for Fuel network
├── fuel-ts-sdk/       # TypeScript SDK for interacting with Starboard
├── contracts/         # Sway smart contracts
└── docker/            # Docker configs for local development
```

## Available Commands

### Development
- `pnpm run dev` - Start frontend dev server
- `pnpm run dev:indexer` - Start indexer
- `pnpm run dev:all` - Start everything (requires Docker)

### Building
- `pnpm run build` - Build all packages
- `pnpm run build:frontend` - Build frontend only
- `pnpm run build:indexer` - Build indexer only
- `pnpm run build:ts-sdk` - Build TypeScript SDK
- `pnpm run build:contracts` - Build Sway contracts

### Code Quality
- `pnpm run lint` - Lint all packages
- `pnpm run lint:fix` - Auto-fix linting issues
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting

### Testing
- `pnpm run test` - Run tests

## Tech Stack

### Frontend
- React 19
- React Router v7
- Tailwind CSS v4
- Vanilla Extract (CSS-in-TS)
- Vite

### Indexer
- Subsquid
- PostgreSQL
- PostGraphile

### Contracts
- Sway
- Fuel SDK

## Environment Variables

### Indexer (`indexer/.env`)
```bash
# Database
DB_NAME=postgres
DB_USER=postgres
DB_PASS=postgres
DB_PORT=23751

# GraphQL
GRAPHQL_SERVER_PORT=4350

# Fuel Network
GATEWAY_URL=https://v2.archive.subsquid.io/network/fuel-testnet
GRAPHQL_URL=https://testnet.fuel.network/v1/graphql

# Contract Addresses
VAULT_PRICEFEED_ADDRESS=0x...
VAULT_ADDRESS=0x...

FROM_BLOCK=42335475
```

## Contributing

We use:
- **Conventional Commits** for commit messages
- **pnpm workspaces** for monorepo management
- **ESLint + Prettier** for code quality

Please ensure your commits follow the [Conventional Commits](https://conventionalcommits.org) specification.

## License

AGPL-3.0 - see [LICENSE](LICENSE) for details.
