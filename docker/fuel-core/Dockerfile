# the files are prepared based on https://github.com/FuelLabs/fuels-wallet/blob/master/docker/fuel-core/Dockerfile
# base files:
# https://github.com/FuelLabs/chain-configuration/blob/master/local/metadata.json
# https://github.com/FuelLabs/chain-configuration/blob/master/upgradelog/ignition-devnet/consensus_parameters/18.json
# https://github.com/FuelLabs/chain-configuration/blob/master/upgradelog/ignition-devnet/state_transition_function/32.wasm

FROM ghcr.io/fuellabs/fuel-core:v0.45.1

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /fuel

COPY ./chain_config.json .
COPY ./metadata.json .
COPY ./state_config.json .
COPY ./state_transition_bytecode.wasm .

EXPOSE 4000

COPY ./fuel_core.sh .

CMD ["sh", "./fuel_core.sh"]
