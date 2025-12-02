import { Provider, Wallet, createAssetId } from 'fuels';
import { StorkMock, Vault, TestnetToken } from '../../contracts/types';

import {
  call,
  getArgs,
  moveBlockchainTime,
  toPrice,
  walletToAddressIdentity,
  expandDecimals,
  DEFAULT_SUB_ID,
  USDC_ASSET,
  BTC_ASSET,
  ETH_ASSET,
  BTC_MAX_LEVERAGE,
  getUsdcConfig,
  getBtcConfig,
  getEthConfig,
  ETH_MAX_LEVERAGE,
} from './utils';

// priv keys are hardcoded, taken form the fuel node starting script
const deployerPK = '0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a'; // 0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6
const user0PK = '0x366079294383ed426ef94b9e86a8e448876a92c1ead9bbf75e6e205a6f4f570d'; // 0xc2833c4eae8a3b056a6f21a04d1a176780d5dc9df621270c41bec86a90c3d770"
const user1PK = '0xb978aa71a1487dc9c1f996493af73f0427cf78f560b606224e7f0089bae04c41'; // 0x7ab1e9d9fd10909aead61cbfd4a5ec2d80bb304f34cfa2b5a9446398e284e92c"
const liquidatorPK = '0xa5675fc7eb0657940fc73f6ec6c5265c045065ddac62e12e1174da030f3868b3'; // 0xad000576cc6dc12183a0306d8809c24f897fbbccfd3f179c571db6659218c088"

// graphql url is hardcoded, taken form the fuel node starting script
const graphQLUrl = 'http://127.0.0.1:4000/v1/graphql';

if (require.main === module) {
  populateEvents(
    getArgs(['mockPricefeedAddress', 'vaultAddress', 'pricefeedWrapperAddress', 'usdcAddress'])
  )
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    });
}

async function populateEvents(taskArgs: any) {
  const provider = new Provider(graphQLUrl);

  // preparation, usually the same for all the populate scripts
  const deployerWallet = Wallet.fromPrivateKey(deployerPK, provider);
  const user0Wallet = Wallet.fromPrivateKey(user0PK, provider);
  const user1Wallet = Wallet.fromPrivateKey(user1PK, provider);
  const liquidatorWallet = Wallet.fromPrivateKey(liquidatorPK, provider);

  const user0Identity = walletToAddressIdentity(user0Wallet);
  const user1Identity = walletToAddressIdentity(user1Wallet);
  const liquidatorIdentity = walletToAddressIdentity(liquidatorWallet);

  const storkMockDeployer = new StorkMock(taskArgs.mockPricefeedAddress, deployerWallet);
  const vaultDeployer = new Vault(taskArgs.vaultAddress, deployerWallet);
  const vaultUser0 = new Vault(taskArgs.vaultAddress, user0Wallet);
  const vaultUser1 = new Vault(taskArgs.vaultAddress, user1Wallet);
  const vaultLiquidator = new Vault(taskArgs.vaultAddress, liquidatorWallet);
  const usdcUser0 = new TestnetToken(taskArgs.usdcAddress, user0Wallet);
  const usdcUser1 = new TestnetToken(taskArgs.usdcAddress, user1Wallet);

  const attachedContracts = [
    taskArgs.vaultAddress,
    taskArgs.pricefeedWrapperAddress,
    taskArgs.mockPricefeedAddress,
  ];
  const USDC_ASSET_ID = createAssetId(taskArgs.usdcAddress, DEFAULT_SUB_ID).bits;

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
