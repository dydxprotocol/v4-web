# Price Feed Service - AWS Deployment Guide

This guide covers deploying the price feed service as a containerized, scheduled ECS Fargate task on AWS.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Deployment Steps](#detailed-deployment-steps)
- [Configuration](#configuration)
- [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
- [Cost Estimation](#cost-estimation)
- [Updating the Service](#updating-the-service)

## Architecture Overview

```
┌─────────────────┐
│  EventBridge    │  Triggers every 5 minutes
│  Scheduler      │
└────────┬────────┘
         │
         v
┌─────────────────┐         ┌──────────────────┐
│   ECS Fargate   │────────>│  Pyth Network    │
│   Task          │         │  API             │
└────────┬────────┘         └──────────────────┘
         │
         v
┌─────────────────┐         ┌──────────────────┐
│  Fuel Network   │<────────│  CloudWatch      │
│  RPC (Testnet)  │         │  Logs            │
└─────────────────┘         └──────────────────┘

Secrets Manager: Stores price signer private key
Parameter Store: Stores RPC URL and contract address
VPC: Private subnets with NAT Gateway for outbound access
```

### Components

- **VPC**: Dedicated virtual network with public and private subnets
- **NAT Gateway**: Enables outbound internet access from private subnets
- **ECS Fargate**: Serverless container platform (no EC2 management)
- **ECR**: Docker image registry
- **EventBridge**: Scheduled task trigger (default: every 5 minutes)
- **Secrets Manager**: Encrypted storage for private key
- **Parameter Store**: Configuration storage for non-sensitive data
- **CloudWatch Logs**: Centralized logging with 30-day retention

## Prerequisites

### Required Tools

- **Docker**: For building container images
- **AWS CLI v2**: For interacting with AWS services
- **Git**: Already installed (you're in the repo)
- **AWS Account**: With appropriate permissions

### AWS Permissions Required

Your AWS IAM user/role needs permissions for:
- CloudFormation (create/update/delete stacks)
- ECS (clusters, task definitions, services)
- ECR (repositories, push images)
- VPC (create networks, subnets, gateways)
- IAM (create roles and policies)
- Secrets Manager (create/read secrets)
- Systems Manager Parameter Store (create/read parameters)
- EventBridge (create/update rules)
- CloudWatch Logs (create log groups)

### AWS Configuration

```bash
# Configure AWS credentials (if not already done)
aws configure

# Verify credentials
aws sts get-caller-identity

# Set your preferred region (optional)
export AWS_REGION=us-east-1
```

## Quick Start

For those who want to deploy immediately:

```bash
# 1. Deploy the infrastructure
./scripts/deploy-stack.sh

# 2. Build and push the Docker image
./scripts/build-and-push.sh

# 3. Trigger the task manually (optional - it will run on schedule)
aws ecs run-task \
  --cluster price-feed-service-cluster \
  --task-definition price-feed-service \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"

# 4. Monitor logs
aws logs tail /ecs/price-feed-service --follow
```

## Detailed Deployment Steps

### Step 1: Deploy Infrastructure

The deployment script will interactively prompt you for all required parameters:

```bash
./scripts/deploy-stack.sh
```

You'll be asked to provide:

1. **Fuel Network RPC URL**
   - Example: `https://testnet.fuel.network/v1/graphql`
   - This is the Fuel blockchain node endpoint

2. **StorkMock Contract Address**
   - Example: `0x1234567890abcdef...`
   - The deployed contract address on Fuel

3. **Price Signer Private Key** (hidden input)
   - The wallet private key with permission to update prices
   - **IMPORTANT**: This will be stored encrypted in AWS Secrets Manager

4. **Schedule Expression** (default: `rate(5 minutes)`)
   - EventBridge schedule format
   - Examples:
     - `rate(5 minutes)` - every 5 minutes
     - `rate(1 hour)` - every hour
     - `cron(0/5 * * * ? *)` - every 5 minutes using cron

5. **Task CPU** (default: 256)
   - 256 = 0.25 vCPU
   - 512 = 0.5 vCPU
   - 1024 = 1 vCPU
   - 2048 = 2 vCPU

6. **Task Memory** (default: 512 MB)
   - Must be compatible with CPU selection
   - Options: 512, 1024, 2048, 4096

7. **VPC CIDR** (default: `10.0.0.0/16`)
   - Network range for the VPC
   - Use default unless you have specific requirements

The script will:
- Validate the CloudFormation template
- Create or update the stack
- Wait for completion (5-10 minutes for initial creation)
- Display stack outputs

### Step 2: Build and Push Docker Image

After infrastructure is deployed:

```bash
./scripts/build-and-push.sh
```

This script will:
1. Check prerequisites (Docker, AWS CLI)
2. Get your AWS account ID
3. Login to ECR
4. Build the Docker image with type generation
5. Tag the image with `latest` and git commit SHA
6. Push to ECR

**Build time**: ~2-3 minutes (depending on network speed)

### Step 3: Verify Deployment

Check that everything is working:

```bash
# View CloudFormation stack status
aws cloudformation describe-stacks --stack-name price-feed-service-stack

# Check ECS cluster
aws ecs describe-clusters --clusters price-feed-service-cluster

# View scheduled rule
aws events describe-rule --name price-feed-service-schedule

# List recent task executions
aws ecs list-tasks --cluster price-feed-service-cluster
```

### Step 4: Monitor First Execution

Wait for the next scheduled run (or trigger manually):

```bash
# Tail logs in real-time
aws logs tail /ecs/price-feed-service --follow

# Or view in AWS Console
# CloudWatch > Log Groups > /ecs/price-feed-service
```

## Configuration

### Updating Configuration Values

#### Non-Sensitive Configuration (Parameter Store)

```bash
# Update Fuel RPC URL
aws ssm put-parameter \
  --name /price-feed-service/fuel-rpc-url \
  --value "https://new-rpc-url.com" \
  --overwrite

# Update contract address
aws ssm put-parameter \
  --name /price-feed-service/contract-address \
  --value "0xnewcontractaddress" \
  --overwrite
```

#### Sensitive Configuration (Secrets Manager)

```bash
# Update private key
aws secretsmanager update-secret \
  --secret-id /price-feed-service/price-signer-private-key \
  --secret-string "new-private-key-here"
```

**Note**: After updating parameters/secrets, you need to update the task definition or force a new deployment.

### Changing Schedule Frequency

Update the CloudFormation stack with new schedule:

```bash
aws cloudformation update-stack \
  --stack-name price-feed-service-stack \
  --use-previous-template \
  --parameters \
    ParameterKey=ScheduleExpression,ParameterValue="rate(10 minutes)" \
    ParameterKey=ServiceName,UsePreviousValue=true \
    ParameterKey=FuelRpcUrl,UsePreviousValue=true \
    ParameterKey=ContractAddress,UsePreviousValue=true \
    ParameterKey=PriceSignerPrivateKey,UsePreviousValue=true \
    ParameterKey=TaskCpu,UsePreviousValue=true \
    ParameterKey=TaskMemory,UsePreviousValue=true \
    ParameterKey=VpcCidr,UsePreviousValue=true \
  --capabilities CAPABILITY_NAMED_IAM
```

### Adjusting Task Resources

If the task needs more CPU or memory:

```bash
# Update via CloudFormation
aws cloudformation update-stack \
  --stack-name price-feed-service-stack \
  --use-previous-template \
  --parameters \
    ParameterKey=TaskCpu,ParameterValue="512" \
    ParameterKey=TaskMemory,ParameterValue="1024" \
    [... other parameters with UsePreviousValue=true] \
  --capabilities CAPABILITY_NAMED_IAM
```

## Monitoring and Troubleshooting

### Viewing Logs

**Real-time logs:**
```bash
aws logs tail /ecs/price-feed-service --follow
```

**Recent logs:**
```bash
aws logs tail /ecs/price-feed-service --since 1h
```

**Filter for errors:**
```bash
aws logs filter-log-events \
  --log-group-name /ecs/price-feed-service \
  --filter-pattern "ERROR"
```

### Common Issues

#### 1. Task Fails to Start

**Symptoms**: Task shows as `STOPPED` immediately after starting

**Debugging**:
```bash
# Get task ARN
TASK_ARN=$(aws ecs list-tasks --cluster price-feed-service-cluster --query 'taskArns[0]' --output text)

# Describe task
aws ecs describe-tasks --cluster price-feed-service-cluster --tasks $TASK_ARN

# Check stopped reason
aws ecs describe-tasks --cluster price-feed-service-cluster --tasks $TASK_ARN \
  --query 'tasks[0].stoppedReason'
```

**Common causes**:
- Image not pushed to ECR
- Invalid parameters/secrets
- Insufficient IAM permissions

#### 2. Image Pull Errors

**Error**: `CannotPullContainerError: Error response from daemon`

**Solution**:
```bash
# Verify image exists in ECR
aws ecr describe-images --repository-name price-feed-service

# If missing, rebuild and push
./scripts/build-and-push.sh
```

#### 3. Price Update Failures

**Symptoms**: Logs show errors updating prices

**Debugging**:
```bash
# Check recent logs for errors
aws logs tail /ecs/price-feed-service --since 30m | grep -i error

# Verify contract address
aws ssm get-parameter --name /price-feed-service/contract-address

# Test RPC connectivity (from EC2 or local)
curl -X POST https://testnet.fuel.network/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { health }"}'
```

**Common causes**:
- Incorrect contract address
- Insufficient wallet balance for gas fees
- Fuel RPC endpoint down or rate-limited
- Pyth Network API issues

#### 4. No Scheduled Executions

**Symptoms**: Task never runs on schedule

**Debugging**:
```bash
# Check EventBridge rule status
aws events describe-rule --name price-feed-service-schedule

# Verify rule is enabled
aws events describe-rule --name price-feed-service-schedule \
  --query 'State' --output text
# Should output: ENABLED

# Check rule targets
aws events list-targets-by-rule --rule price-feed-service-schedule
```

**Solution**:
```bash
# Enable the rule if disabled
aws events enable-rule --name price-feed-service-schedule
```

### Setting Up CloudWatch Alarms

Create alarms for task failures:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name price-feed-task-failures \
  --alarm-description "Alert when price feed task fails" \
  --metric-name TasksFailed \
  --namespace ECS/ContainerInsights \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=price-feed-service-cluster \
  --alarm-actions <SNS_TOPIC_ARN>
```

## Cost Estimation

Estimated monthly costs for US-East-1 region:

| Resource | Specifications | Est. Monthly Cost |
|----------|---------------|-------------------|
| ECS Fargate Tasks | 0.25 vCPU, 0.5GB RAM, 30s runtime, every 5min | $2-3 |
| NAT Gateway | Data processing + hourly charge | $32-35 |
| ECR Storage | ~200MB image | $0.20 |
| Secrets Manager | 1 secret | $0.40 |
| CloudWatch Logs | ~100MB/month, 30-day retention | $0.50 |
| Data Transfer | Minimal outbound | $0.50 |
| **Total** | | **~$35-40/month** |

**Cost optimization tips**:
- Reduce schedule frequency (e.g., every 10-15 minutes instead of 5)
- Use smaller task size if workload permits (current: 0.25 vCPU, 512MB)
- Reduce log retention from 30 to 7 days
- Consider VPC endpoints instead of NAT Gateway (can save ~$30/month but requires more setup)

## Updating the Service

### Deploying Code Changes

After making changes to the price feed script:

```bash
# 1. Rebuild and push new image
./scripts/build-and-push.sh

# 2. Update task definition (forces ECS to use new image)
aws ecs update-service \
  --cluster price-feed-service-cluster \
  --service price-feed-service \
  --force-new-deployment

# Note: Since this is a scheduled task (not a service), the new image
# will be used automatically on the next scheduled run
```

### Deploying Infrastructure Changes

After modifying CloudFormation template:

```bash
./scripts/deploy-stack.sh
# Answer prompts with updated values
```

### Rolling Back

```bash
# Rollback CloudFormation stack
aws cloudformation cancel-update-stack --stack-name price-feed-service-stack

# Or manually update to previous version
aws cloudformation update-stack \
  --stack-name price-feed-service-stack \
  --use-previous-template \
  [... parameters]

# Push previous Docker image version
docker tag price-feed-service:previous-tag \
  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/price-feed-service:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/price-feed-service:latest
```

## Cleanup

To completely remove all resources:

```bash
# 1. Delete CloudFormation stack (removes most resources)
aws cloudformation delete-stack --stack-name price-feed-service-stack

# 2. Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name price-feed-service-stack

# 3. Delete ECR images (if desired)
aws ecr batch-delete-image \
  --repository-name price-feed-service \
  --image-ids imageTag=latest

# 4. Delete ECR repository
aws ecr delete-repository --repository-name price-feed-service --force

# 5. Delete secrets/parameters (if desired)
aws secretsmanager delete-secret \
  --secret-id /price-feed-service/price-signer-private-key \
  --force-delete-without-recovery

aws ssm delete-parameters \
  --names /price-feed-service/fuel-rpc-url /price-feed-service/contract-address
```

**Note**: NAT Gateway and Elastic IP deletion may take a few minutes.

## Support and Contributing

- Report issues: [GitHub Issues](https://github.com/your-org/starboard-oracle-service/issues)
- For AWS-specific issues, check [AWS Documentation](https://docs.aws.amazon.com/)
- Fuel Network docs: [https://docs.fuel.network/](https://docs.fuel.network/)

## Security Best Practices

1. **Never commit secrets**: Private keys are stored in Secrets Manager
2. **Rotate keys regularly**: Use AWS Secrets Manager rotation
3. **Review IAM permissions**: Use least privilege principle
4. **Enable AWS CloudTrail**: Audit all API calls
5. **Use VPC endpoints**: Reduce internet exposure (optional, more complex)
6. **Monitor costs**: Set up AWS Budgets alerts
7. **Regular updates**: Keep dependencies and base images updated
