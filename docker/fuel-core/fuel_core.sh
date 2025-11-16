#!/bin/bash

# TODO change to --poa-interval-period 1sec \

# Start the Fuel Core node
/root/fuel-core run \
    --ip 0.0.0.0 \
    --port 4000 \
    --db-path ./mnt/db/ \
    --utxo-validation \
    --vm-backtrace \
    --poa-interval-period 1sec \
    --debug \
    --min-gas-price ${MIN_GAS_PRICE} \
    --snapshot ./ \
    --consensus-key ${CONSENSUS_KEY_SECRET}

