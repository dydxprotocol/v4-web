# Starboard Docker Makefile
# Simplified commands for managing the local development environment

.PHONY: help setup up start down restart logs logs-indexer logs-api logs-fuel logs-db status clean build rebuild \
	deploy-contracts mint-usdc mint-usdc-user1 mint-usdc-custom feed-prices dev-rebuild-indexer \
	ps health test test-api test-fuel shell-indexer shell-api shell-fuel shell-db restart-indexer restart-api

# Default target
.DEFAULT_GOAL := help

# Docker compose files
COMPOSE_FILES := -f docker-compose.yml

help: ## Show this help message
	@echo ""
	@echo "╔════════════════════════════════════════════════════════╗"
	@echo "║                                                        ║"
	@echo "║           Starboard Docker Commands                    ║"
	@echo "║                                                        ║"
	@echo "╚════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Available commands:"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

setup: ## Initial setup - starts services
	@echo "Starting services (will build images if needed)..."
	@docker-compose $(COMPOSE_FILES) up -d --build
	@echo ""
	@echo "✓ Setup complete!"
	@$(MAKE) --no-print-directory status
	@echo ""
	@echo "Service URLs:"
	@echo "  Fuel Core:    http://localhost:4000/v1/graphql"
	@echo "  Indexer API:  http://localhost:4350/graphql"
	@echo ""

up: ## Start services (builds if needed)
	@docker-compose $(COMPOSE_FILES) up -d --build

start: ## Start services (no rebuild, faster)
	@docker-compose $(COMPOSE_FILES) up -d

down: ## Stop and remove all containers
	@docker-compose $(COMPOSE_FILES) down

restart: ## Restart all services
	@docker-compose $(COMPOSE_FILES) restart

restart-indexer: ## Restart just the indexer processor
	@docker-compose $(COMPOSE_FILES) restart indexer

restart-api: ## Restart just the API
	@docker-compose $(COMPOSE_FILES) restart api

logs: ## Show logs from all services
	@docker-compose $(COMPOSE_FILES) logs -f

logs-indexer: ## Show logs from indexer processor
	@docker-compose $(COMPOSE_FILES) logs -f indexer

logs-api: ## Show logs from API
	@docker-compose $(COMPOSE_FILES) logs -f api

logs-fuel: ## Show logs from fuel-core
	@docker-compose $(COMPOSE_FILES) logs -f fuel-core

logs-db: ## Show logs from database
	@docker-compose $(COMPOSE_FILES) logs -f db

status: ## Show status of all containers
	@echo "Container Status:"
	@docker ps --filter name=starboard --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

ps: status ## Alias for status

build: ## Build/rebuild images
	@docker-compose $(COMPOSE_FILES) build

rebuild: down ## Full rebuild - stops containers, removes volumes, rebuilds images
	@docker-compose $(COMPOSE_FILES) down -v
	@docker-compose $(COMPOSE_FILES) build --no-cache
	@docker-compose $(COMPOSE_FILES) up -d

clean: ## Remove all containers, volumes, and images
	@echo "This will remove all containers, volumes, and images. Are you sure? [y/N]"
	@read -r response; \
	if [ "$$response" = "y" ] || [ "$$response" = "Y" ]; then \
		docker-compose $(COMPOSE_FILES) down -v --rmi all; \
		echo "✓ Cleaned up successfully"; \
	else \
		echo "Cancelled"; \
	fi

shell-indexer: ## Open shell in indexer container
	@docker exec -it starboard_indexer_processor bash

shell-api: ## Open shell in API container
	@docker exec -it starboard_indexer_api bash

shell-fuel: ## Open shell in fuel-core container
	@docker exec -it starboard_fuel_core bash

shell-db: ## Open psql in database
	@docker exec -it starboard_indexer_db psql -U postgres -d postgres

health: ## Check health of all services
	@echo "Health Status:"
	@echo ""
	@printf "Fuel Core:   "
	@if docker ps --filter name=starboard_fuel_core --format '{{.Status}}' | grep -q '(healthy)'; then \
		echo "✓ Healthy"; \
	else \
		echo "✗ Unhealthy or starting"; \
	fi
	@printf "Database:    "
	@if docker ps --filter name=starboard_indexer_db --format '{{.Status}}' | grep -q '(healthy)'; then \
		echo "✓ Healthy"; \
	else \
		echo "✗ Unhealthy or starting"; \
	fi
	@printf "Indexer:     "
	@if docker ps --filter name=starboard_indexer_processor --format '{{.Status}}' | grep -q '(healthy)'; then \
		echo "✓ Healthy"; \
	elif docker ps --filter name=starboard_indexer_processor --format '{{.Status}}' | grep -q 'Up'; then \
		echo "⏳ Starting"; \
	else \
		echo "✗ Not running"; \
	fi
	@printf "API:         "
	@if docker ps --filter name=starboard_indexer_api --format '{{.Status}}' | grep -q '(healthy)'; then \
		echo "✓ Healthy"; \
	elif docker ps --filter name=starboard_indexer_api --format '{{.Status}}' | grep -q 'Up'; then \
		echo "⏳ Starting"; \
	else \
		echo "✗ Not running"; \
	fi

test-api: ## Test the GraphQL API
	@echo "Testing GraphQL API..."
	@curl -s -X POST http://localhost:4350/graphql \
		-H "Content-Type: application/json" \
		-d '{"query": "{ __schema { queryType { name } } }"}' | \
		grep -q '"name":"Query"' && \
		echo "✓ API is responding" || \
		echo "✗ API is not responding"

test-fuel: ## Test fuel-core health
	@echo "Testing Fuel Core..."
	@curl -s http://localhost:4000/v1/health | grep -q '"up":true' && \
		echo "✓ Fuel Core is healthy" || \
		echo "✗ Fuel Core is not responding"

test: test-fuel test-api ## Run all tests

# Contract deployment
deploy-contracts: ## Deploy contracts to local node
	@docker exec -t starboard_indexer_processor bash -i -c /root/setup_starboard_contracts.sh

# Asset management
mint-usdc: ## Mint USDC to User0 account (default test account)
	@echo "Minting 1M USDC to User0..."
	@docker exec -t --env-file .env.docker starboard_indexer_processor \
		bash -i -c "pnpm --filter starboard/contracts faucet \
		--url=http://starboard_fuel_core:4000/v1/graphql \
		--privK=\$${USER0_PRIV_K} \
		--token=\$${USDC_ADDRESS}"
	@echo "✓ USDC minted successfully"

mint-usdc-user1: ## Mint USDC to User1 account
	@echo "Minting 1M USDC to User1..."
	@docker exec -t --env-file .env.docker starboard_indexer_processor \
		bash -i -c "pnpm --filter starboard/contracts faucet \
		--url=http://starboard_fuel_core:4000/v1/graphql \
		--privK=\$${USER1_PRIV_K} \
		--token=\$${USDC_ADDRESS}"
	@echo "✓ USDC minted to User1 successfully"

mint-usdc-custom: ## Mint USDC to custom account (usage: make mint-usdc-custom PRIV_K=0x...)
	@if [ -z "$(PRIV_K)" ]; then \
		echo "Error: PRIV_K not set"; \
		echo "Usage: make mint-usdc-custom PRIV_K=0x..."; \
		exit 1; \
	fi
	@echo "Minting 1M USDC to custom account..."
	@docker exec -t -e PRIV_K=$(PRIV_K) \
		--env-file .env.docker starboard_indexer_processor \
		bash -i -c "pnpm --filter starboard/contracts faucet \
		--url=http://starboard_fuel_core:4000/v1/graphql \
		--privK=\$${PRIV_K} \
		--token=\$${USDC_ADDRESS}"
	@echo "✓ USDC minted successfully"

feed-prices: ## Update oracle prices from Pyth
	@echo "Fetching and feeding prices from Pyth..."
	@docker exec -t --env-file .env.docker starboard_indexer_processor \
		bash -i -c "pnpm --filter starboard/contracts prices:feed \
		--url=http://starboard_fuel_core:4000/v1/graphql \
		--priceSignerPrivK=\$${PRICE_SIGNER_PRIV_K} \
		--mockPricefeedAddress=\$${VAULT_PRICEFEED_ADDRESS}"
	@echo "✓ Prices updated successfully"

# Development workflow
# Note: This Makefile must be run from the docker/ directory
dev-rebuild-indexer: ## Rebuild local indexer code and restart
	@echo "Building indexer..."
	@$(MAKE) -C ../indexer build || (cd ../indexer && pnpm build)
	@echo "Restarting indexer..."
	@$(MAKE) --no-print-directory restart-indexer
	@echo "✓ Indexer updated with local code"
