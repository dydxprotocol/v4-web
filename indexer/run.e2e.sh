#!/bin/bash

set -e

pnpm sqd up:e2e
./e2e/run.sh e2e/populate-events-liquidation.ts e2e/verify-indexer-liquidation.test.ts
pnpm sqd down:e2e

pnpm sqd up:e2e
./e2e/run.sh e2e/populate-events-liquidity.ts e2e/verify-indexer-liquidity.test.ts
pnpm sqd down:e2e

pnpm sqd up:e2e
./e2e/run.sh e2e/populate-events-positions.ts e2e/verify-indexer-positions.test.ts
pnpm sqd down:e2e

pnpm sqd up:e2e
./e2e/run.sh e2e/populate-events-price.ts e2e/verify-indexer-price.test.ts
pnpm sqd down:e2e
