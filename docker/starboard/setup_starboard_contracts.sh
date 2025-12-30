#!/bin/bash

set -e

cd /starboard/contracts

pnpm deploy:stork-mock --url=http://starboard_fuel_core:4000/v1/graphql --privK=0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a --salt=${SALT}

pnpm setup:testnet --url=http://starboard_fuel_core:4000/v1/graphql --privK=0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a --storkContractAddress=${VAULT_PRICEFEED_ADDRESS} --salt=${SALT}


