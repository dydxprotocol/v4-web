# Starboard - Indexer


## Getting started

Review `.env` file.

### Prerequisites

* Node.js (version 20.x and above)
* Docker

### Run indexer

```bash
# Install dependencies
pnpm install

# Compile the project
pnpm build

# Launch Postgres database to store the data
docker compose up -d

# Apply database migrations to create the target schema
pnpm apply:migration

# Run indexer
node -r dotenv/config lib/main.js

# Run API
npx squid-graphql-server

# Erase the indexer data
docker compose down -v

# Checkout indexed logs
docker exec "$(basename "$(pwd)")-db-1" psql -U postgres \
  -c "SELECT id, logs_count, found_at FROM contract ORDER BY logs_count desc LIMIT 10"
```

## E2E Tests

End to end tests are executed with the bash script `e2e/run.sh`.
It depends on the `contracts` package: to run the fuel test node and deploy contracts.
The script runs the fuel node, deploys contracts and mocks, executes a test script,
starts up the database, starts up the indexer, waits for the indexer to process the events
and shuts everything down.

Build contracts
```shell
pnpm --filter starboard/contracts build
pnpm --filter starboard/contracts gen:types
```

Run an example test
```shell
./e2e/run.sh e2e/populate-events-price.ts e2e/verify-indexer-price.test.ts
```

The interactive mode simply waits for Ctrl-C to initialize the shutdown 
in order to enable the infrastructure for other test purposes
```shell
./e2e/run.sh e2e/populate-events-price.ts e2e/verify-indexer-price.test.ts i
```

The script `e2e/populate-events-price.ts` is the referencial one.
It sends transactions to blockchain to populate events.
To provide more tests, copy the script and replace the section with testing code.
Each test scripts requires a separate execution of `run.sh`.
This is a standalone script executed with `ts-node`.

The script `e2e/verify-indexer-price.test.ts` is the referential one.
It connects to db or the indexer API and tests the processing results.
It is also posibble to send additional transactions that emit events,
but an additional code to watch the indexer sync would be required.
The script is vitest compatible. It is excluded in a normal run.
Here a dedicated mode `indexer-e2e` is used to execute the script with vitest.
