import { Provider, Wallet, createAssetId } from 'fuels';
import { StorkMock, TestnetToken, Vault } from '../../contracts/types';
import {
  BNB_ASSET,
  BNB_MAX_LEVERAGE,
  BTC_ASSET,
  BTC_MAX_LEVERAGE,
  DEFAULT_SUB_ID,
  DEPLOYER_PK,
  ETH_ASSET,
  ETH_MAX_LEVERAGE,
  USDC_ASSET,
  USER_0_PK,
  USER_1_PK,
  USER_2_PK,
  call,
  expandDecimals,
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
  const user2Wallet = Wallet.fromPrivateKey(USER_2_PK, provider);

  const user0Identity = walletToAddressIdentity(user0Wallet);
  const user1Identity = walletToAddressIdentity(user1Wallet);
  const user2Identity = walletToAddressIdentity(user2Wallet);

  const storkMockDeployer = new StorkMock(mockPricefeedAddress, deployerWallet);
  const vaultDeployer = new Vault(vaultAddress, deployerWallet);
  const vaultUser0 = new Vault(vaultAddress, user0Wallet);
  const vaultUser1 = new Vault(vaultAddress, user1Wallet);
  const vaultUser2 = new Vault(vaultAddress, user2Wallet);
  const usdcUser0 = new TestnetToken(usdcAddress, user0Wallet);
  const usdcUser1 = new TestnetToken(usdcAddress, user1Wallet);
  const usdcUser2 = new TestnetToken(usdcAddress, user2Wallet);

  const attachedContracts = [vaultAddress, pricefeedWrapperAddress, mockPricefeedAddress];
  const USDC_ASSET_ID = createAssetId(usdcAddress, DEFAULT_SUB_ID).bits;

  await call(
    vaultDeployer.functions.set_fees(
      30, // mint_burn_fee_basis_points
      10, // margin_fee_basis_points
      expandDecimals(5) // liquidation_fee_usd
    )
  );
  await call(vaultDeployer.functions.set_max_leverage(BTC_ASSET, BTC_MAX_LEVERAGE));
  await call(vaultDeployer.functions.set_max_leverage(BNB_ASSET, BNB_MAX_LEVERAGE));
  await call(vaultDeployer.functions.set_max_leverage(ETH_ASSET, ETH_MAX_LEVERAGE));

  // custom code, populate the events

  // gives 1_000_000 USDC (plus 6 decimals)
  await call(usdcUser0.functions.faucet());
  await call(usdcUser1.functions.faucet());
  await call(usdcUser2.functions.faucet());

  await call(storkMockDeployer.functions.update_price(USDC_ASSET, toPrice(1)));
  await call(storkMockDeployer.functions.update_price(ETH_ASSET, toPrice(3000)));
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(40000)));
  await call(storkMockDeployer.functions.update_price(BNB_ASSET, toPrice(900)));
  await moveBlockchainTime(provider, 2, 1);

  // BNB opan and close position x 2
  await call(
    vaultUser0.functions
      .increase_position(user0Identity, BNB_ASSET, expandDecimals(1000), true)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );
  await call(
    vaultUser0.functions
      .increase_position(user0Identity, BNB_ASSET, expandDecimals(1000), true)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );
  await call(
    vaultUser0.functions
      .decrease_position(user0Identity, BNB_ASSET, '0', expandDecimals(2000), true, user0Identity)
      .addContracts(attachedContracts)
  );
  await call(
    vaultUser0.functions
      .increase_position(user0Identity, BNB_ASSET, expandDecimals(1000), true)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );
  await call(
    vaultUser0.functions
      .increase_position(user0Identity, BNB_ASSET, expandDecimals(1000), true)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );
  await call(
    vaultUser0.functions
      .decrease_position(user0Identity, BNB_ASSET, '0', expandDecimals(2000), true, user0Identity)
      .addContracts(attachedContracts)
  );

  // ETH mixed two users
  await call(
    vaultUser0.functions
      .increase_position(user0Identity, ETH_ASSET, expandDecimals(2000), true)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );
  await call(
    vaultUser1.functions
      .increase_position(user1Identity, ETH_ASSET, expandDecimals(1000), true)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );
  await call(
    vaultUser0.functions
      .decrease_position(user0Identity, ETH_ASSET, '0', expandDecimals(1000), true, user0Identity)
      .addContracts(attachedContracts)
  );
  await call(
    vaultUser1.functions
      .increase_position(user1Identity, ETH_ASSET, expandDecimals(1000), true)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );

  // long and short BTC positions
  await call(
    vaultUser1.functions
      .increase_position(user1Identity, BTC_ASSET, expandDecimals(2000), false)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );
  await call(
    vaultUser2.functions
      .increase_position(user2Identity, BTC_ASSET, expandDecimals(2000), true)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(100), USDC_ASSET_ID],
      })
  );
  await call(
    vaultUser2.functions
      .decrease_position(user2Identity, BTC_ASSET, '50', expandDecimals(1000), true, user2Identity)
      .addContracts(attachedContracts)
  );
  await call(
    vaultUser1.functions
      .decrease_position(user1Identity, BTC_ASSET, '50', expandDecimals(1000), false, user1Identity)
      .addContracts(attachedContracts)
  );
}
