#!/bin/bash

# Starboard Local Development Setup Script
# Thin wrapper around docker-compose that handles .env setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Header
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║    Starboard Local Development Environment Setup      ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker."
    exit 1
fi
print_success "Docker is ready"

echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    if [ -f ".env.example" ]; then
        print_status "Creating .env from .env.example..."
        cp .env.example .env
        print_success ".env file created"
    else
        print_error ".env.example not found. Cannot create .env file."
        exit 1
    fi
else
    print_success ".env file exists"
fi

echo ""

# Let docker-compose handle everything (builds, starts, health checks)
print_status "Starting services (docker-compose will build images if needed)..."
echo ""

docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

if [ $? -eq 0 ]; then
    print_success "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

echo ""
print_status "Waiting for services to become healthy..."
sleep 5

echo ""

# Display service URLs
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║                  Setup Complete! 🎉                    ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Service Endpoints:"
echo "──────────────────────────────────────────────────────────"
echo "  Fuel Core GraphQL:  http://localhost:4000/v1/graphql"
echo "  Indexer GraphQL:    http://localhost:4350/graphql"
echo "  PostgreSQL:         localhost:23751"
echo ""
echo "Prefunded Test Account (Deployer):"
echo "──────────────────────────────────────────────────────────"
echo "  Private Key: 0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a"
echo "  Address:     0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6"
echo ""
echo "Useful Commands:"
echo "──────────────────────────────────────────────────────────"
echo "  View logs:           docker logs starboard_indexer_processor"
echo "  Check status:        docker ps --filter name=starboard"
echo "  Stop services:       docker-compose -f docker-compose.yml -f docker-compose.dev.yml down"
echo "  Restart indexer:     docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart indexer"
echo ""
echo "Next Steps:"
echo "──────────────────────────────────────────────────────────"
echo "  1. Deploy contracts (if needed):"
echo "     docker exec -t starboard_indexer_processor bash -i -c /root/setup_starboard_contracts.sh"
echo ""
echo "  2. Test the API:"
echo "     curl -X POST http://localhost:4350/graphql \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"query\": \"{ accounts(limit: 5) { id address } }\"}'"
echo ""
echo "  3. Read the setup guide:"
echo "     cat SETUP_GUIDE.md"
echo ""
print_success "Happy coding! 🚀"
echo ""

