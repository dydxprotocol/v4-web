/**
 * Example: Depositing Liquidity into Starboard Pool
 * 
 * This example demonstrates how to use the Starboard SDK to deposit
 * USDC liquidity into the pool and receive RLP tokens.
 */

import { Provider, Wallet } from 'fuels';
import { LiquidityClient } from '../src';

// Configuration
const FUEL_PROVIDER_URL = 'https://testnet.fuel.network/v1/graphql'; // Fuel testnet
const VAULT_CONTRACT_ID = '0x...'; // Replace with actual vault contract ID
const USDC_ASSET_ID = '0x...'; // Replace with actual USDC asset ID
const GRAPHQL_ENDPOINT = 'http://localhost:4350/graphql'; // Starboard indexer

// Private key for signing transactions (use environment variable in production)
const PRIVATE_KEY = process.env.FUEL_PRIVATE_KEY || '0x...';

/**
 * Example 1: Basic Liquidity Deposit
 */
async function basicDepositExample() {
  console.log('=== Basic Liquidity Deposit Example ===\n');

  // Initialize the client
  const liquidityClient = new LiquidityClient({
    providerUrl: FUEL_PROVIDER_URL,
    vaultContractId: VAULT_CONTRACT_ID,
    usdcAssetId: USDC_ASSET_ID,
    graphqlEndpoint: GRAPHQL_ENDPOINT,
  });

  // Connect to provider
  await liquidityClient.connect();
  console.log('✓ Connected to Fuel network\n');

  // Create wallet from private key
  const provider = await Provider.create(FUEL_PROVIDER_URL);
  const wallet = Wallet.fromPrivateKey(PRIVATE_KEY, provider);
  console.log(`Wallet address: ${wallet.address.toB256()}\n`);

  // Check USDC balance
  const usdcBalance = await liquidityClient.getUsdcBalance(wallet);
  console.log(`USDC Balance: ${usdcBalance} USDC\n`);

  // Amount to deposit (in human-readable format)
  const depositAmount = '1000.00';

  // Preview the deposit
  console.log(`Previewing deposit of ${depositAmount} USDC...`);
  const preview = await liquidityClient.previewDeposit(wallet, depositAmount);
  console.log('Preview Results:');
  console.log(`  - RLP tokens to receive: ${preview.rlpTokensToReceive}`);
  console.log(`  - Amount after fees: ${preview.amountAfterFees} USDC`);
  console.log(`  - Fee: ${preview.feeAmount} USDC (${preview.feeBasisPoints / 100}%)\n`);

  // Execute the deposit
  console.log('Executing deposit...');
  const result = await liquidityClient.deposit(wallet, {
    usdcAmount: depositAmount,
  });

  console.log('\n✓ Deposit successful!');
  console.log(`  - Transaction ID: ${result.transactionId}`);
  console.log(`  - RLP received: ${result.rlpReceived}`);
  console.log(`  - Gas used: ${result.gasUsed.toString()}\n`);
}

/**
 * Example 2: Deposit with Slippage Protection
 */
async function depositWithSlippageProtection() {
  console.log('=== Deposit with Slippage Protection Example ===\n');

  const liquidityClient = new LiquidityClient({
    providerUrl: FUEL_PROVIDER_URL,
    vaultContractId: VAULT_CONTRACT_ID,
    usdcAssetId: USDC_ASSET_ID,
  });

  await liquidityClient.connect();

  const provider = await Provider.create(FUEL_PROVIDER_URL);
  const wallet = Wallet.fromPrivateKey(PRIVATE_KEY, provider);

  const depositAmount = '5000.00';

  // Preview to get expected RLP
  const preview = await liquidityClient.previewDeposit(wallet, depositAmount);
  
  // Set minimum RLP with 1% slippage tolerance
  const minRlpAmount = (parseFloat(preview.rlpTokensToReceive) * 0.99).toFixed(6);
  console.log(`Minimum RLP tokens (1% slippage): ${minRlpAmount}\n`);

  // Execute with slippage protection
  const result = await liquidityClient.deposit(wallet, {
    usdcAmount: depositAmount,
    minRlpAmount: minRlpAmount,
  });

  console.log('✓ Deposit with slippage protection successful!\n');
}

/**
 * Example 3: Check Pool Statistics Before Depositing
 */
async function checkPoolStatistics() {
  console.log('=== Pool Statistics Example ===\n');

  const liquidityClient = new LiquidityClient({
    providerUrl: FUEL_PROVIDER_URL,
    vaultContractId: VAULT_CONTRACT_ID,
    usdcAssetId: USDC_ASSET_ID,
    graphqlEndpoint: GRAPHQL_ENDPOINT,
  });

  await liquidityClient.connect();

  const provider = await Provider.create(FUEL_PROVIDER_URL);
  const wallet = Wallet.fromPrivateKey(PRIVATE_KEY, provider);

  // Get comprehensive pool statistics
  const stats = await liquidityClient.getPoolStatistics(wallet);

  console.log('Pool Statistics:');
  console.log(`  - Total Value Locked (TVL): $${stats.tvl.toLocaleString()}`);
  console.log(`  - Total RLP Supply: ${stats.totalRlpSupply}`);
  console.log(`  - RLP Price: $${stats.rlpPrice.toFixed(6)}`);
  console.log(`  - 7-Day APY: ${stats.sevenDayApy.toFixed(2)}%`);
  console.log(`  - Utilization Rate: ${stats.utilizationRate.toFixed(2)}%`);
  console.log(`  - Pool Status: ${stats.isPaused ? 'PAUSED' : 'ACTIVE'}\n`);

  // Calculate maximum deposit (10% of TVL or $1M)
  const maxDeposit = Math.min(stats.tvl * 0.1, 1_000_000);
  console.log(`Maximum deposit allowed: $${maxDeposit.toLocaleString()}\n`);
}

/**
 * Example 4: Check User Position
 */
async function checkUserPosition() {
  console.log('=== User Position Example ===\n');

  const liquidityClient = new LiquidityClient({
    providerUrl: FUEL_PROVIDER_URL,
    vaultContractId: VAULT_CONTRACT_ID,
    usdcAssetId: USDC_ASSET_ID,
    graphqlEndpoint: GRAPHQL_ENDPOINT,
  });

  await liquidityClient.connect();

  const provider = await Provider.create(FUEL_PROVIDER_URL);
  const wallet = Wallet.fromPrivateKey(PRIVATE_KEY, provider);
  const userAddress = wallet.address.toB256();

  // Get user's position
  const position = await liquidityClient.getUserPosition(wallet, userAddress);

  console.log('Your Liquidity Position:');
  console.log(`  - USDC Deposited: $${parseFloat(position.usdcDeposited).toLocaleString()}`);
  console.log(`  - RLP Balance: ${parseFloat(position.rlpBalance).toLocaleString()}`);
  console.log(`  - Current Value: $${parseFloat(position.currentValue).toLocaleString()}`);
  console.log(`  - P&L: $${parseFloat(position.pnl).toLocaleString()}`);
  console.log(`  - P&L Percentage: ${position.pnlPercentage.toFixed(2)}%\n`);
}

/**
 * Example 5: Validate Deposit Before Execution
 */
async function validateDepositExample() {
  console.log('=== Validate Deposit Example ===\n');

  const liquidityClient = new LiquidityClient({
    providerUrl: FUEL_PROVIDER_URL,
    vaultContractId: VAULT_CONTRACT_ID,
    usdcAssetId: USDC_ASSET_ID,
  });

  await liquidityClient.connect();

  const provider = await Provider.create(FUEL_PROVIDER_URL);
  const wallet = Wallet.fromPrivateKey(PRIVATE_KEY, provider);

  const depositAmount = '500.00';

  // Validate before depositing
  console.log(`Validating deposit of ${depositAmount} USDC...`);
  const validation = await liquidityClient.validateDeposit(wallet, depositAmount);

  if (validation.valid) {
    console.log('✓ Deposit is valid and can proceed\n');
    
    // Calculate fee
    const fee = await liquidityClient.calculateFee(wallet, depositAmount);
    console.log(`Estimated fee: ${fee} USDC\n`);
  } else {
    console.error(`✗ Deposit validation failed: ${validation.error}\n`);
  }
}

/**
 * Example 6: Complete Workflow
 */
async function completeWorkflowExample() {
  console.log('=== Complete Deposit Workflow ===\n');

  // Step 1: Initialize client
  const liquidityClient = new LiquidityClient({
    providerUrl: FUEL_PROVIDER_URL,
    vaultContractId: VAULT_CONTRACT_ID,
    usdcAssetId: USDC_ASSET_ID,
    graphqlEndpoint: GRAPHQL_ENDPOINT,
  });

  await liquidityClient.connect();
  console.log('✓ Step 1: Connected to network\n');

  // Step 2: Setup wallet
  const provider = await Provider.create(FUEL_PROVIDER_URL);
  const wallet = Wallet.fromPrivateKey(PRIVATE_KEY, provider);
  console.log('✓ Step 2: Wallet initialized\n');

  // Step 3: Check pool statistics
  const stats = await liquidityClient.getPoolStatistics(wallet);
  console.log('✓ Step 3: Pool statistics retrieved');
  console.log(`   TVL: $${stats.tvl.toLocaleString()}, APY: ${stats.sevenDayApy.toFixed(2)}%\n`);

  // Step 4: Check user balance
  const balance = await liquidityClient.getUsdcBalance(wallet);
  console.log(`✓ Step 4: User balance checked: ${balance} USDC\n`);

  // Step 5: Validate deposit
  const depositAmount = '250.00';
  const validation = await liquidityClient.validateDeposit(wallet, depositAmount);
  
  if (!validation.valid) {
    console.error(`✗ Validation failed: ${validation.error}`);
    return;
  }
  console.log('✓ Step 5: Deposit validated\n');

  // Step 6: Preview deposit
  const preview = await liquidityClient.previewDeposit(wallet, depositAmount);
  console.log('✓ Step 6: Deposit previewed');
  console.log(`   Will receive: ${preview.rlpTokensToReceive} RLP\n`);

  // Step 7: Execute deposit
  console.log('✓ Step 7: Executing deposit...');
  const result = await liquidityClient.deposit(wallet, {
    usdcAmount: depositAmount,
  });
  console.log(`   Transaction: ${result.transactionId}\n`);

  // Step 8: Check updated position
  const position = await liquidityClient.getUserPosition(wallet, wallet.address.toB256());
  console.log('✓ Step 8: Position updated');
  console.log(`   Total RLP: ${position.rlpBalance}`);
  console.log(`   Current Value: $${position.currentValue}\n`);

  console.log('🎉 Complete workflow finished successfully!\n');
}

// Error handling wrapper
async function runExample(exampleFn: () => Promise<void>, name: string) {
  try {
    await exampleFn();
  } catch (error) {
    console.error(`\n❌ Error in ${name}:`);
    console.error(error instanceof Error ? error.message : error);
    console.error('\n');
  }
}

// Main execution
async function main() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  Starboard Liquidity Deposit Examples         ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Run examples (uncomment the ones you want to run)
  
  // await runExample(basicDepositExample, 'Basic Deposit');
  // await runExample(depositWithSlippageProtection, 'Slippage Protection');
  // await runExample(checkPoolStatistics, 'Pool Statistics');
  // await runExample(checkUserPosition, 'User Position');
  // await runExample(validateDepositExample, 'Validate Deposit');
  await runExample(completeWorkflowExample, 'Complete Workflow');
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  basicDepositExample,
  depositWithSlippageProtection,
  checkPoolStatistics,
  checkUserPosition,
  validateDepositExample,
  completeWorkflowExample,
};

