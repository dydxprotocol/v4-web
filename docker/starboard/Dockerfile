# Starboard Application Dockerfile
# Standard Docker practice - builds from local filesystem context
# Use: docker build -f docker/starboard/Dockerfile -t starboard .

FROM ubuntu:24.04 AS base

# Install system dependencies
RUN apt update && apt install -y \
    git \
    curl \
    postgresql-client \
    build-essential \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Fuel toolchain
RUN curl https://install.fuel.network | sh && \
    echo 'export PATH="${HOME}/.fuelup/bin:${PATH}"' >> ${HOME}/.bashrc && \
    export PATH="${HOME}/.fuelup/bin:${PATH}" && \
    fuelup update && \
    fuelup toolchain install mainnet && \
    fuelup default mainnet

# Install Node.js via nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
    export NVM_DIR="$HOME/.nvm" && \
    . ${HOME}/.nvm/nvm.sh && \
    nvm install 22

# Install pnpm
RUN curl -fsSL https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

# Install node-gyp globally for native module builds
RUN export NVM_DIR="$HOME/.nvm" && \
    . ${HOME}/.nvm/nvm.sh && \
    npm install -g node-gyp

WORKDIR /starboard

# Copy package files first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
COPY indexer/package.json ./indexer/
COPY fuel-ts-sdk/package.json fuel-ts-sdk/codegen.yml fuel-ts-sdk/scalar-definitions.graphql fuel-ts-sdk/rollup.config.mjs fuel-ts-sdk/tsconfig.build.json fuel-ts-sdk/tsconfig.json ./fuel-ts-sdk/
COPY contracts/package.json ./contracts/

# Copy files needed by preinstall and postinstall scripts
COPY frontend/scripts ./frontend/scripts
COPY packages/tradingview.tgz ./packages/
COPY indexer/schema.graphql ./indexer/

# Install dependencies (cached if package files haven't changed)
RUN export PNPM_HOME="/root/.local/share/pnpm" && \
    export PATH="$PNPM_HOME:${PATH}" && \
    export PATH="${HOME}/.fuelup/bin:${PATH}" && \
    export NVM_DIR="$HOME/.nvm" && \
    . ${HOME}/.nvm/nvm.sh && \
    pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Ensure TradingView is extracted (in case COPY didn't preserve it from postinstall)
RUN export NVM_DIR="$HOME/.nvm" && \
    . ${HOME}/.nvm/nvm.sh && \
    cd /starboard/frontend && \
    ([ -f ../packages/tradingview.tgz ] && tar -xzC public -f ../packages/tradingview.tgz || true)

# Build the application
RUN export PNPM_HOME="/root/.local/share/pnpm" && \
    export PATH="$PNPM_HOME:${PATH}" && \
    export PATH="${HOME}/.fuelup/bin:${PATH}" && \
    export NVM_DIR="$HOME/.nvm" && \
    . ${HOME}/.nvm/nvm.sh && \
    pnpm --filter starboard/contracts build && \
    pnpm --filter starboard/contracts gen:types && \
    pnpm --filter @starboard/indexer build && \
    pnpm --filter fuel-ts-sdk build && \
    pnpm --filter frontend build

# Copy contract setup script
RUN if [ -f docker/starboard/setup_starboard_contracts.sh ]; then \
        cp docker/starboard/setup_starboard_contracts.sh /root/ && \
        chmod +x /root/setup_starboard_contracts.sh; \
    fi

# Set up environment
ENV NVM_DIR="/root/.nvm"
ENV PATH="/root/.fuelup/bin:/root/.local/share/pnpm:${PATH}"

# Default command (can be overridden by docker-compose)
CMD ["bash"]
