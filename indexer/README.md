# Starboard - Indexer

## Getting started

Review `.env` file.

### Prerequisites

- Node.js (version 20.x and above)
- Docker

### Run indexer

```bash
# Install dependencies
pnpm install

# Compile the project
pnpm build
# or
pnpm sqd build

# Launch Postgres database to store the data
docker compose up -d

# Apply database migrations to create the target schema
pnpm sqd migration:apply

# Run indexer
node -r dotenv/config lib/main.js
# or (this does not require the project to be build)
pnpm start

# Run API, update db connection params,
# for the production consult postgres docs for safer configuration
pnpm postgraphile -c "postgres://postgres:postgres@localhost:23751/postgres" --enhance-graphiql

# Erase the indexer data
docker compose down -v

# Checkout the indexer
docker exec "indexer-db-1" psql -U postgres \
  -c "select * from migrations"

# Checkout out recent prices
docker exec "indexer-db-1" psql -U postgres \
  -c "select * from price order by timestamp desc limit 12"

# Checkout out recent positions
docker exec "indexer-db-1" psql -U postgres \
  -c "select * from position order by timestamp desc limit 12;"
```

## E2E Tests

End-to-end tests are executed with the bash script `e2e/run.sh`.
It depends on the `docker` and `contracts` packages: to run the fuel test node and deploy contracts.
The script deploys contracts and mocks, executes a test script,
starts up the indexer, waits for the indexer to process the events
and shuts everything down. The database and the fuel node have to run separately.

Build contracts

```shell
pnpm --filter starboard/contracts build
pnpm --filter starboard/contracts gen:types
```

To build the Docker image `starboard/fuel-core` refer to the `docker/README.md` instruction.

Run the database and the fuel node.

```shell
pnpm sqd up:e2e
```

Run an example test

```shell
./e2e/run.sh e2e/populate-events-price.ts e2e/verify-indexer-price.test.ts
```

Shut down the database and the fuel node.

```shell
pnpm sqd down:e2e
```

The interactive mode simply waits for Ctrl-C to initialize the shutdown
to enable the infrastructure for other test purposes

```shell
./e2e/run.sh e2e/populate-events-price.ts e2e/verify-indexer-price.test.ts i
```

The script `e2e/populate-events-price.ts` is the referential one.
It sends transactions to blockchain to populate events.
To provide more tests, copy the script and replace the section with testing code.
Each test scripts requires a separate execution of `run.sh`.
This is a standalone script executed with `ts-node`.

The script `e2e/verify-indexer-price.test.ts` is the referential one.
It connects to db or the indexer API and tests the processing results.
It is also possible to send additional transactions that emit events,
but an additional code to watch the indexer sync would be required.
The script is vitest compatible. It is excluded in a normal run.
Here a dedicated mode `indexer-e2e` is used to execute the script with vitest.

## Migrations

**NOTICE.** Important when changing the schema and generating migrations scripts.

### Views, etc

Some functionalities are enable through db views, triggers, associated tables.
They are not generated from the schema, they are provided with custom migrations scripts.
Such scripts are marked with the comment `// NON GENERATED MIGRATION`.
In case the schema is changed, they may need to be updated as well - it must be done manually.

### ES module compliance

If you apply a generated migration script and get this or similar error:

```text
ReferenceError: module is not defined in ES module scope
```

then provide the following changes in the migrations scripts.
At the beginning of migration script, replace such lines

```javascript
module.exports = class Data1768329135947 {
```

with such lines

```javascript
export default class Data1768329135947 {
```

It must be done manually.

## Model Generation - Codegen

**NOTICE.** Important when schemas are changed.

There are two schema files: `schema.graphql` and `schema.derivatives.graphql`.
Codegen tool generates .ts source files from the schemas
into the `src/model/generated`.
Codegen is not in the chain of build process
because it generates code incompatible with ECMAScript.
Rather generated files are added to the repo.
If any schema is changed, the model have to be regenerated manually and corrected:
the extension `.js` needs to be added in import statements.
