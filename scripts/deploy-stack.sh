#!/bin/bash

# Price Feed Service - Deploy CloudFormation Stack
# Deploys or updates the infrastructure stack in AWS

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="price-feed-service"
STACK_NAME="${STACK_NAME:-price-feed-service-stack}"
REGION="${AWS_REGION:-us-east-1}"
TEMPLATE_FILE="$(dirname "$0")/../infrastructure/price-feed-service.yaml"
ENV_FILE="$(dirname "$0")/../infrastructure/.env"

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

log_prompt() {
    echo -e "${BLUE}[INPUT]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed or not in PATH"
        exit 1
    fi

    if [ ! -f "$TEMPLATE_FILE" ]; then
        log_error "CloudFormation template not found: $TEMPLATE_FILE"
        exit 1
    fi

    # Validate AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured or invalid"
        exit 1
    fi

    log_info "All prerequisites satisfied"
}

check_stack_exists() {
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" &> /dev/null
}

get_parameters() {
    log_info "Gathering deployment parameters..."
    echo ""

    # Fuel RPC URL
    if [ -z "${FUEL_RPC_URL:-}" ]; then
        log_prompt "Enter Fuel Network RPC URL:"
        echo "  Example: https://testnet.fuel.network/v1/graphql"
        read -r FUEL_RPC_URL
    else
        log_info "Using FUEL_RPC_URL from environment"
    fi
    if [ -z "$FUEL_RPC_URL" ]; then
        log_error "Fuel RPC URL is required"
        exit 1
    fi

    # Contract Address
    if [ -z "${CONTRACT_ADDRESS:-}" ]; then
        log_prompt "Enter StorkMock contract address:"
        echo "  Example: 0x1234567890abcdef..."
        read -r CONTRACT_ADDRESS
    else
        log_info "Using CONTRACT_ADDRESS from environment"
    fi
    if [ -z "$CONTRACT_ADDRESS" ]; then
        log_error "Contract address is required"
        exit 1
    fi

    # Private Key (hidden input)
    if [ -z "${PRICE_SIGNER_PRIVATE_KEY:-}" ]; then
        log_prompt "Enter price signer private key (input will be hidden):"
        read -s -r PRIVATE_KEY
        echo ""
    else
        log_info "Using PRICE_SIGNER_PRIVATE_KEY from environment"
        PRIVATE_KEY="$PRICE_SIGNER_PRIVATE_KEY"
    fi
    if [ -z "$PRIVATE_KEY" ]; then
        log_error "Private key is required"
        exit 1
    fi

    # Schedule Expression
    if [ -z "${SCHEDULE_EXPRESSION:-}" ]; then
        log_prompt "Enter EventBridge schedule expression [rate(5 minutes)]:"
        echo "  Examples: rate(5 minutes), cron(0/5 * * * ? *)"
        read -r SCHEDULE_EXPR
        SCHEDULE_EXPR="${SCHEDULE_EXPR:-rate(5 minutes)}"
    else
        log_info "Using SCHEDULE_EXPRESSION from environment"
        SCHEDULE_EXPR="$SCHEDULE_EXPRESSION"
    fi

    # CPU
    TASK_CPU="${TASK_CPU:-256}"
    if [ "$TASK_CPU" = "256" ] && [ -z "${TASK_CPU_FROM_ENV:-}" ]; then
        log_prompt "Enter task CPU [256]:"
        echo "  Options: 256 (0.25 vCPU), 512 (0.5 vCPU), 1024 (1 vCPU), 2048 (2 vCPU)"
        read -r TASK_CPU_INPUT
        TASK_CPU="${TASK_CPU_INPUT:-256}"
    else
        log_info "Using TASK_CPU from environment: $TASK_CPU"
    fi

    # Memory
    TASK_MEMORY="${TASK_MEMORY:-512}"
    if [ "$TASK_MEMORY" = "512" ] && [ -z "${TASK_MEMORY_FROM_ENV:-}" ]; then
        log_prompt "Enter task memory in MB [512]:"
        echo "  Options: 512, 1024, 2048, 4096"
        read -r TASK_MEMORY_INPUT
        TASK_MEMORY="${TASK_MEMORY_INPUT:-512}"
    else
        log_info "Using TASK_MEMORY from environment: $TASK_MEMORY"
    fi

    # VPC CIDR
    VPC_CIDR="${VPC_CIDR:-10.0.0.0/16}"
    if [ "$VPC_CIDR" = "10.0.0.0/16" ] && [ -z "${VPC_CIDR_FROM_ENV:-}" ]; then
        log_prompt "Enter VPC CIDR block [10.0.0.0/16]:"
        read -r VPC_CIDR_INPUT
        VPC_CIDR="${VPC_CIDR_INPUT:-10.0.0.0/16}"
    else
        log_info "Using VPC_CIDR from environment: $VPC_CIDR"
    fi

    echo ""
    log_info "Parameters collected successfully"
}

validate_template() {
    log_info "Validating CloudFormation template..."

    aws cloudformation validate-template \
        --template-body "file://${TEMPLATE_FILE}" \
        --region "$REGION" > /dev/null

    if [ $? -ne 0 ]; then
        log_error "Template validation failed"
        exit 1
    fi

    log_info "Template is valid"
}

deploy_stack() {
    if check_stack_exists; then
        log_info "Stack exists. Updating stack: $STACK_NAME"
        ACTION="update"
        COMMAND="update-stack"
    else
        log_info "Stack does not exist. Creating stack: $STACK_NAME"
        ACTION="create"
        COMMAND="create-stack"
    fi

    # Build parameters array
    PARAMETERS=(
        "ParameterKey=ServiceName,ParameterValue=${SERVICE_NAME}"
        "ParameterKey=ScheduleExpression,ParameterValue=${SCHEDULE_EXPR}"
        "ParameterKey=FuelRpcUrl,ParameterValue=${FUEL_RPC_URL}"
        "ParameterKey=ContractAddress,ParameterValue=${CONTRACT_ADDRESS}"
        "ParameterKey=PriceSignerPrivateKey,ParameterValue=${PRIVATE_KEY}"
        "ParameterKey=TaskCpu,ParameterValue=${TASK_CPU}"
        "ParameterKey=TaskMemory,ParameterValue=${TASK_MEMORY}"
        "ParameterKey=VpcCidr,ParameterValue=${VPC_CIDR}"
    )

    # Deploy the stack
    aws cloudformation "$COMMAND" \
        --stack-name "$STACK_NAME" \
        --template-body "file://${TEMPLATE_FILE}" \
        --parameters "${PARAMETERS[@]}" \
        --capabilities CAPABILITY_NAMED_IAM \
        --region "$REGION" \
        --tags "Key=Service,Value=${SERVICE_NAME}" "Key=ManagedBy,Value=CloudFormation"

    if [ $? -ne 0 ]; then
        log_error "Failed to ${ACTION} stack"
        exit 1
    fi

    log_info "Stack ${ACTION} initiated. Waiting for completion..."
}

wait_for_stack() {
    if [ "$ACTION" = "create" ]; then
        WAITER="stack-create-complete"
    else
        WAITER="stack-update-complete"
    fi

    aws cloudformation wait "$WAITER" \
        --stack-name "$STACK_NAME" \
        --region "$REGION"

    if [ $? -ne 0 ]; then
        log_error "Stack ${ACTION} failed or timed out"
        log_info "Check events: aws cloudformation describe-stack-events --stack-name ${STACK_NAME} --region ${REGION}"
        exit 1
    fi

    log_info "Stack ${ACTION} completed successfully!"
}

display_outputs() {
    log_info "Stack Outputs:"
    echo ""

    OUTPUTS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs' \
        --output table)

    echo "$OUTPUTS"
    echo ""
}

print_next_steps() {
    ECR_URI=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryUri`].OutputValue' \
        --output text)

    LOG_GROUP=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`LogGroupName`].OutputValue' \
        --output text)

    echo "========================================="
    log_info "Deployment Complete!"
    echo "========================================="
    echo "Stack Name: ${STACK_NAME}"
    echo "Region: ${REGION}"
    echo ""
    log_info "Next steps:"
    echo ""
    echo "1. Build and push Docker image:"
    echo "   ./scripts/build-and-push.sh"
    echo ""
    echo "2. Update task definition with new image:"
    echo "   aws ecs update-service --cluster ${SERVICE_NAME}-cluster \\"
    echo "     --service ${SERVICE_NAME} --force-new-deployment \\"
    echo "     --region ${REGION}"
    echo ""
    echo "3. Monitor logs:"
    echo "   aws logs tail ${LOG_GROUP} --follow --region ${REGION}"
    echo ""
    echo "4. Check scheduled executions:"
    echo "   aws ecs list-tasks --cluster ${SERVICE_NAME}-cluster --region ${REGION}"
    echo ""
    log_warn "Note: The scheduled task won't run until you build and push a Docker image!"
    echo "========================================="
}

confirm_deployment() {
    echo ""
    echo "========================================="
    log_warn "Deployment Summary"
    echo "========================================="
    echo "Stack Name: ${STACK_NAME}"
    echo "Region: ${REGION}"
    echo "Fuel RPC URL: ${FUEL_RPC_URL}"
    echo "Contract Address: ${CONTRACT_ADDRESS}"
    echo "Schedule: ${SCHEDULE_EXPR}"
    echo "Task CPU: ${TASK_CPU}"
    echo "Task Memory: ${TASK_MEMORY}"
    echo "VPC CIDR: ${VPC_CIDR}"
    echo "========================================="
    echo ""

    log_prompt "Do you want to proceed with deployment? (yes/no)"
    read -r CONFIRM

    if [ "$CONFIRM" != "yes" ] && [ "$CONFIRM" != "y" ]; then
        log_warn "Deployment cancelled by user"
        exit 0
    fi
}

# Main execution
main() {
    log_info "Starting deployment of ${SERVICE_NAME}..."
    echo ""

    # Load environment variables from .env file if it exists
    if [ -f "$ENV_FILE" ]; then
        log_info "Loading configuration from $ENV_FILE"
        set -a  # automatically export all variables
        source "$ENV_FILE"
        set +a
    fi

    check_prerequisites
    get_parameters
    confirm_deployment
    validate_template
    deploy_stack
    wait_for_stack
    display_outputs
    print_next_steps
}

# Run main function
main "$@"
