FROM ubuntu:24.04

RUN apt update && apt install -y git curl postgresql-client && rm -rf /var/lib/apt/lists/*

RUN curl https://install.fuel.network | sh && \
    echo 'export PATH="${HOME}/.fuelup/bin:${PATH}"' >> ${HOME}/.bashrc && \
    export PATH="${HOME}/.fuelup/bin:${PATH}" && \
    fuelup update && \
    fuelup toolchain install mainnet && \
    fuelup default mainnet

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
    export NVM_DIR="$HOME/.nvm" && \
    . ${HOME}/.nvm/nvm.sh && \
    nvm install 18

RUN curl -fsSL https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

RUN git clone \
    https://github.com/wt-xyz/starboard.git \
    /starboard && \
    cd /starboard && \
    git checkout lglen/feat/STAR-306-indexer-update

WORKDIR /starboard

RUN export PNPM_HOME="${HOME}/.local/share/pnpm" && \
    export PATH="$PNPM_HOME:$PATH" && \
    export PATH="${HOME}/.fuelup/bin:${PATH}" && \
    export NVM_DIR="$HOME/.nvm" && \
    . ${HOME}/.nvm/nvm.sh && \
    pnpm install --ignore-scripts --frozen-lockfile && \
    pnpm run build:ts-sdk && \
    pnpm --filter starboard/contracts build && \
    pnpm --filter starboard/contracts gen:types && \
    pnpm --filter starboard/indexer build && \
    tar -xzC public -f tradingview/tradingview.tgz

COPY --chmod=0744 ./wait_for_db.sh /root/
COPY --chmod=0744 ./setup_starboard_contracts.sh /root/

