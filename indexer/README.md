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
