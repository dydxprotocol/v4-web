#!/bin/bash

# Generate contract types
pnpm fuels typegen -i $(find ./contracts -name '*-abi.json' | grep -v '/scripts') -o ./types