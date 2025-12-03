# Starboard Application Dockerfile
# Standard Docker practice - builds from local filesystem context
# Use: docker build -f docker/starboard/Dockerfile -t starboard .

FROM ubuntu:24.04 AS base

# Install system dependencies
RUN apt update && apt install -y \
    git \
    curl \
    postgresql-client \
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
    nvm install 18

# Install pnpm
RUN curl -fsSL https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

WORKDIR /starboard

# Copy package files first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/indexer/package.json ./apps/indexer/
COPY contracts/package.json ./contracts/
COPY ts-sdk/package.json ./ts-sdk/

# Copy files needed by preinstall and postinstall scripts
COPY scripts ./scripts
COPY tradingview ./tradingview
COPY apps/indexer/.env.example ./apps/indexer/c
RUN mkdir -p public

# Install dependencies (cached if package files haven't changed)
RUN export PNPM_HOME="/root/.local/share/pnpm" && \
    export PATH="$PNPM_HOME:${PATH}" && \
    export PATH="${HOME}/.fuelup/bin:${PATH}" && \
    export NVM_DIR="$HOME/.nvm" && \
    . ${HOME}/.nvm/nvm.sh && \
    pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build the application
RUN export PNPM_HOME="/root/.local/share/pnpm" && \
    export PATH="$PNPM_HOME:${PATH}" && \
    export PATH="${HOME}/.fuelup/bin:${PATH}" && \
    export NVM_DIR="$HOME/.nvm" && \
    . ${HOME}/.nvm/nvm.sh && \
    pnpm run build:ts-sdk && \
    pnpm --filter starboard/contracts build && \
    pnpm --filter starboard/contracts gen:types && \
    pnpm --filter starboard-indexer build && \
    if [ -f tradingview/tradingview.tgz ]; then tar -xzC public -f tradingview/tradingview.tgz; fi

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
