import { Provider, Wallet, createAssetId } from 'fuels';
import { StorkMock, TestnetToken, Vault } from '../../contracts/types';
import {
  BTC_ASSET,
  BTC_MAX_LEVERAGE,
  DEFAULT_SUB_ID,
  DEPLOYER_PK,
  ETH_ASSET,
  ETH_MAX_LEVERAGE,
  LIQUIDATOR_PK,
  USDC_ASSET,
  USER_0_PK,
  USER_1_PK,
  call,
  expandDecimals,
  getBtcConfig,
  getEthConfig,
  getUsdcConfig,
  moveBlockchainTime,
  toPrice,
  walletToAddressIdentity,
} from './utils';

// graphql url is hardcoded, taken form the fuel node starting script
const graphQLUrl = 'http://127.0.0.1:4000/v1/graphql';

if (require.main === module) {
  populateEvents()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

async function populateEvents() {
  const mockPricefeedAddress = process.env.MOCK_STORK_CONTRACT;
  const vaultAddress = process.env.VAULT_CONTRACT;
  const pricefeedWrapperAddress = process.env.PRICEFEED_WRAPPER_CONTRACT;
  const usdcAddress = process.env.USDC_CONTRACT;

  if (!mockPricefeedAddress || !vaultAddress || !pricefeedWrapperAddress || !usdcAddress) {
    throw new Error(
      'Missing required environment variables: MOCK_STORK_CONTRACT, VAULT_CONTRACT, PRICEFEED_WRAPPER_CONTRACT, USDC_CONTRACT'
    );
  }

  const provider = new Provider(graphQLUrl);

  // preparation, usually the same for all the populate scripts
  const deployerWallet = Wallet.fromPrivateKey(DEPLOYER_PK, provider);
  const user0Wallet = Wallet.fromPrivateKey(USER_0_PK, provider);
  const user1Wallet = Wallet.fromPrivateKey(USER_1_PK, provider);
  const liquidatorWallet = Wallet.fromPrivateKey(LIQUIDATOR_PK, provider);

  const user0Identity = walletToAddressIdentity(user0Wallet);
  const user1Identity = walletToAddressIdentity(user1Wallet);
  const liquidatorIdentity = walletToAddressIdentity(liquidatorWallet);

  const storkMockDeployer = new StorkMock(mockPricefeedAddress, deployerWallet);
  const vaultDeployer = new Vault(vaultAddress, deployerWallet);
  const vaultUser0 = new Vault(vaultAddress, user0Wallet);
  const vaultUser1 = new Vault(vaultAddress, user1Wallet);
  const vaultLiquidator = new Vault(vaultAddress, liquidatorWallet);
  const usdcUser0 = new TestnetToken(usdcAddress, user0Wallet);
  const usdcUser1 = new TestnetToken(usdcAddress, user1Wallet);

  const attachedContracts = [vaultAddress, pricefeedWrapperAddress, mockPricefeedAddress];
  const USDC_ASSET_ID = createAssetId(usdcAddress, DEFAULT_SUB_ID).bits;

  // Setup vault configuration
  await call(vaultDeployer.functions.set_liquidator(liquidatorIdentity, true));
  await call(
    vaultDeployer.functions.set_fees(
      30, // mint_burn_fee_basis_points
      10, // margin_fee_basis_points
      expandDecimals(5) // liquidation_fee_usd
    )
  );
  await call(vaultDeployer.functions.set_asset_config(...getUsdcConfig()));
  await call(vaultDeployer.functions.set_asset_config(...getBtcConfig()));
  await call(vaultDeployer.functions.set_asset_config(...getEthConfig()));
  await call(vaultDeployer.functions.set_max_leverage(BTC_ASSET, BTC_MAX_LEVERAGE));
  await call(vaultDeployer.functions.set_max_leverage(ETH_ASSET, ETH_MAX_LEVERAGE));

  // Mint USDC tokens for users
  await call(usdcUser0.functions.faucet());
  await call(usdcUser1.functions.faucet());

  // Set initial prices
  await call(storkMockDeployer.functions.update_price(USDC_ASSET, toPrice(1)));
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(40000)));
  await call(storkMockDeployer.functions.update_price(ETH_ASSET, toPrice(3000)));
  await moveBlockchainTime(provider, 2, 1);

  // Add liquidity to vault (needed for positions to work)
  await call(
    vaultUser0.functions
      .add_liquidity(user0Identity)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(40000), USDC_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 5, 1);

  // Scenario 1: User0 creates a long BTC position and gets liquidated due to price drop
  await call(
    vaultUser0.functions
      .increase_position(user0Identity, BTC_ASSET, expandDecimals(1000), true)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 10, 1);

  // Price drops significantly, triggering liquidation
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(36000)));
  await moveBlockchainTime(provider, 3, 1);

  // Liquidate User0's long position
  await call(
    vaultLiquidator.functions.liquidate_position(user0Identity, BTC_ASSET, true, liquidatorIdentity)
  );
  await moveBlockchainTime(provider, 5, 1);

  // Scenario 2: User1 creates a short BTC position and gets liquidated due to price increase
  await call(
    vaultUser1.functions
      .increase_position(user1Identity, BTC_ASSET, expandDecimals(1000), false)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 8, 1);

  // Price increases significantly, triggering liquidation
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44000)));
  await moveBlockchainTime(provider, 3, 1);

  // Liquidate User1's short position
  await call(
    vaultLiquidator.functions.liquidate_position(
      user1Identity,
      BTC_ASSET,
      false,
      liquidatorIdentity
    )
  );
  await moveBlockchainTime(provider, 7, 1);

  // Scenario 3: User0 creates a long ETH position and gets liquidated due to max leverage exceeded
  // Reset BTC price for ETH test
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(40000)));
  await call(
    vaultUser0.functions
      .increase_position(user0Identity, ETH_ASSET, expandDecimals(1000), true)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 12, 1);

  // Price drops to trigger max leverage liquidation
  await call(storkMockDeployer.functions.update_price(ETH_ASSET, toPrice(2750)));
  await moveBlockchainTime(provider, 4, 1);

  // Liquidate User0's ETH long position
  await call(
    vaultLiquidator.functions.liquidate_position(user0Identity, ETH_ASSET, true, liquidatorIdentity)
  );
  await moveBlockchainTime(provider, 6, 1);
}
