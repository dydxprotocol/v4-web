#!/bin/bash

# Start the Fuel Core node with increased GraphQL limits for indexer compatibility
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
    --consensus-key ${CONSENSUS_KEY_SECRET} \
    --graphql-max-complexity 200000000 \
    --graphql-max-depth 20 \
    --graphql-max-recursive-depth 20

