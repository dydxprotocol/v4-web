# Price Feed Service - Deployment Guide

## Quick Start with Environment Variables

### 1. Create Configuration File

Copy the example file and fill in your values:

```bash
cp infrastructure/.env.example infrastructure/.env
```

### 2. Edit `.env` File

Open `infrastructure/.env` and set your values:

```bash
# Required values
FUEL_RPC_URL=https://testnet.fuel.network/v1/graphql
CONTRACT_ADDRESS=0xYourContractAddressHere
PRICE_SIGNER_PRIVATE_KEY=your_private_key_here

# Optional values (these have defaults)
SCHEDULE_EXPRESSION=rate(5 minutes)
TASK_CPU=256
TASK_MEMORY=512
VPC_CIDR=10.0.0.0/16
AWS_REGION=us-east-1
STACK_NAME=price-feed-service-stack
```

### 3. Deploy Infrastructure

```bash
./scripts/deploy-stack.sh
```

The script will:
- Load values from `infrastructure/.env`
- Skip prompting for values that are already set
- Still prompt for any missing required values
- Display what values it's using from environment

### 4. Build and Push Docker Image

After the CloudFormation stack deploys successfully:

```bash
./scripts/build-and-push.sh
```

This will:
- Build the Docker image with type generation
- Push to the ECR repository created by CloudFormation

### 5. Verify Deployment

Check the logs:
```bash
aws logs tail /ecs/price-feed-service --follow
```

Check scheduled tasks:
```bash
aws ecs list-tasks --cluster price-feed-service-cluster
```

## Alternative: Interactive Mode

If you don't create a `.env` file, the script will prompt for all values interactively:

```bash
./scripts/deploy-stack.sh
```

## Updating Configuration

To update parameters after deployment:

1. Update values in `infrastructure/.env`
2. Re-run the deployment script:
   ```bash
   ./scripts/deploy-stack.sh
   ```
3. CloudFormation will update only the changed resources

## Security Notes

- **Never commit `infrastructure/.env`** to git (it contains your private key)
- The `.gitignore` is already configured to exclude `.env` files
- The private key is stored encrypted in AWS Secrets Manager
- Use AWS IAM roles and policies to control access

## Troubleshooting

### Stack Creation Failed

Check CloudFormation events:
```bash
aws cloudformation describe-stack-events --stack-name price-feed-service-stack
```

### Task Not Running

1. Check EventBridge rule is enabled:
   ```bash
   aws events describe-rule --name price-feed-service-schedule
   ```

2. Check task logs:
   ```bash
   aws logs tail /ecs/price-feed-service --since 1h
   ```

### Price Updates Failing

Check the CloudWatch logs for errors and verify:
- Fuel RPC URL is accessible
- Contract address is correct
- Wallet has sufficient balance for gas fees
