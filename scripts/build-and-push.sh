#!/bin/bash

# Price Feed Service - Build and Push Script
# Builds the Docker image and pushes it to AWS ECR

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="price-feed-service"
REGION="${AWS_REGION:-us-east-1}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed or not in PATH"
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    log_info "All prerequisites satisfied"
}

get_account_id() {
    log_info "Getting AWS account ID..."
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    if [ -z "$ACCOUNT_ID" ]; then
        log_error "Failed to get AWS account ID. Check AWS credentials."
        exit 1
    fi
    log_info "Account ID: $ACCOUNT_ID"
}

login_to_ecr() {
    log_info "Logging in to ECR..."
    aws ecr get-login-password --region "$REGION" | \
        docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

    if [ $? -ne 0 ]; then
        log_error "Failed to login to ECR"
        exit 1
    fi
    log_info "Successfully logged in to ECR"
}

ensure_ecr_repository() {
    log_info "Checking if ECR repository exists..."

    if ! aws ecr describe-repositories --repository-names "$SERVICE_NAME" --region "$REGION" &> /dev/null; then
        log_warn "ECR repository does not exist. It will be created by CloudFormation."
        log_warn "Please deploy the CloudFormation stack first: ./scripts/deploy-stack.sh"
        exit 1
    fi

    log_info "ECR repository exists"
}

build_image() {
    log_info "Building Docker image..."

    REPO_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${SERVICE_NAME}"

    # Build from the contracts directory
    cd "$(dirname "$0")/../contracts"

    docker build \
        --platform linux/amd64 \
        -t "${SERVICE_NAME}:${IMAGE_TAG}" \
        -t "${REPO_URI}:${IMAGE_TAG}" \
        -t "${REPO_URI}:$(git rev-parse --short HEAD)" \
        -f Dockerfile \
        ..

    if [ $? -ne 0 ]; then
        log_error "Docker build failed"
        exit 1
    fi

    log_info "Successfully built image: ${SERVICE_NAME}:${IMAGE_TAG}"
}

push_image() {
    log_info "Pushing image to ECR..."

    REPO_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${SERVICE_NAME}"

    # Push all tags
    docker push "${REPO_URI}:${IMAGE_TAG}"
    docker push "${REPO_URI}:$(git rev-parse --short HEAD)"

    if [ $? -ne 0 ]; then
        log_error "Failed to push image to ECR"
        exit 1
    fi

    log_info "Successfully pushed image to ECR"
    log_info "Image URI: ${REPO_URI}:${IMAGE_TAG}"
}

print_summary() {
    echo ""
    echo "========================================="
    log_info "Build and Push Complete!"
    echo "========================================="
    echo "Repository: ${REPO_URI}"
    echo "Image Tag: ${IMAGE_TAG}"
    echo "Git SHA: $(git rev-parse --short HEAD)"
    echo ""
    log_info "Next steps:"
    echo "  1. Deploy/update the CloudFormation stack: ./scripts/deploy-stack.sh"
    echo "  2. Monitor logs: aws logs tail /ecs/${SERVICE_NAME} --follow"
    echo "========================================="
}

# Main execution
main() {
    log_info "Starting build and push process for ${SERVICE_NAME}..."

    check_prerequisites
    get_account_id
    login_to_ecr
    ensure_ecr_repository
    build_image
    push_image
    print_summary
}

# Run main function
main "$@"
