# Multi-stage build for price feed service
# Stage 1: Build and generate types
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 py3-setuptools make g++

# Install pnpm
RUN npm install -g pnpm@8.6.6

# Copy package files and scripts (from contracts workspace)
COPY contracts/package.json contracts/pnpm-lock.yaml ./
COPY contracts/tasks/utils.ts ./tasks/utils.ts

# Install all dependencies (including fuels for type generation)
# Skip postinstall scripts as they're for frontend assets we don't need
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy ABI files from contracts build (need .json, .bin, and storage_slots for type generation)
COPY contracts/contracts/mocks/stork-mock/out/release/stork-mock-abi.json ./abi/
COPY contracts/contracts/mocks/stork-mock/out/release/stork-mock.bin ./abi/
COPY contracts/contracts/mocks/stork-mock/out/release/stork-mock-storage_slots.json ./abi/

# Generate TypeScript types from ABI
RUN mkdir -p types && \
    pnpm fuels typegen -i ./abi/stork-mock-abi.json -o ./types

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 py3-setuptools make g++

# Install pnpm
RUN npm install -g pnpm@8.6.6

# Copy package files from contracts workspace
COPY contracts/package.json contracts/pnpm-lock.yaml ./

# Install all dependencies including devDependencies (ts-node is needed for runtime)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Remove build dependencies to reduce image size
RUN apk del python3 make g++

# Copy generated types from builder
COPY --from=builder /app/types ./types

# Copy source files
COPY contracts/tasks ./tasks

# Set up environment
ENV NODE_ENV=production

# The script expects these arguments:
# --url <FUEL_RPC_URL>
# --priceSignerPrivK <PRIVATE_KEY>
# --mockPricefeedAddress <CONTRACT_ADDRESS>
ENTRYPOINT ["pnpm", "prices:feed"]
