#!/bin/bash

cd /starboard/contracts

pnpm deploy:stork-mock --url=http://starboard_fuel_core:4000/v1/graphql --privK=0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a

pnpm setup:testnet --url=http://starboard_fuel_core:4000/v1/graphql --privK=0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a --storkContractAddress=0x422729Dc06fD5811ec48eDf38915a52aa6383B3a2e91a7f45F1eECaAba2aEf81


