import { Provider, Wallet, createAssetId } from 'fuels';

// eslint-disable-next-line import/no-relative-packages
import { StorkMock, Vault, TestnetToken } from '../../contracts/types';
import {
  call,
  moveBlockchainTime,
  toPrice,
  walletToAddressIdentity,
  expandDecimals,
  DEFAULT_SUB_ID,
  USDC_ASSET,
  ETH_ASSET,
  BTC_ASSET,
  deployerPK,
  user0PK,
  user1PK,
  user2PK,
} from './utils';

// graphql url is hardcoded, taken form the fuel node starting script
const graphQLUrl = 'http://127.0.0.1:4000/v1/graphql';

if (require.main === module) {
  populateEvents()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    });
}

async function populateEvents() {
  const mockPricefeedAddress = process.env.MOCK_STORK_CONTRACT;
  const vaultAddress = process.env.VAULT_CONTRACT;
  const usdcAddress = process.env.USDC_CONTRACT;

  if (!mockPricefeedAddress || !vaultAddress || !usdcAddress) {
    throw new Error(
      'Missing required environment variables: MOCK_STORK_CONTRACT, VAULT_CONTRACT, USDC_CONTRACT'
    );
  }

  const provider = new Provider(graphQLUrl);

  // preparation, usually the same for all the populate scripts
  const deployerWallet = Wallet.fromPrivateKey(deployerPK, provider);
  const user0Wallet = Wallet.fromPrivateKey(user0PK, provider);
  const user1Wallet = Wallet.fromPrivateKey(user1PK, provider);
  const user2Wallet = Wallet.fromPrivateKey(user2PK, provider);

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

  const attachedContracts = [vaultAddress, mockPricefeedAddress];
  const USDC_ASSET_ID = createAssetId(usdcAddress, DEFAULT_SUB_ID).bits;

  // Get LP asset ID from vault
  const lpAssetResult = await vaultDeployer.functions.get_lp_asset().get();
  const LP_ASSET_ID = lpAssetResult.value.bits.toString();

  // custom code, populate the events
  // Mint USDC tokens for users
  await call(usdcUser0.functions.faucet());
  await call(usdcUser1.functions.faucet());
  await call(usdcUser2.functions.faucet());

  // Set initial prices
  await call(storkMockDeployer.functions.update_price(USDC_ASSET, toPrice(1)));
  await call(storkMockDeployer.functions.update_price(ETH_ASSET, toPrice(3000)));
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45000)));
  await moveBlockchainTime(provider, 2, 1);

  // User0 adds liquidity (10000 USDC)
  await call(
    vaultUser0.functions
      .add_liquidity(user0Identity)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(10000), USDC_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 5, 1);

  // User1 adds liquidity (5000 USDC)
  await call(
    vaultUser1.functions
      .add_liquidity(user1Identity)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(5000), USDC_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 10, 1);

  // User0 adds more liquidity (3000 USDC)
  await call(
    vaultUser0.functions
      .add_liquidity(user0Identity)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(3000), USDC_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 8, 1);

  // User2 adds liquidity (7000 USDC)
  await call(
    vaultUser2.functions
      .add_liquidity(user2Identity)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(7000), USDC_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 12, 1);

  // Get LP token balances for removal
  const user0LpBalance = await user0Wallet.getBalance(LP_ASSET_ID);
  const user1LpBalance = await user1Wallet.getBalance(LP_ASSET_ID);

  // User0 removes half of their liquidity
  const user0RemoveAmount = user0LpBalance.div(2);
  await call(
    vaultUser0.functions
      .remove_liquidity(user0Identity)
      .addContracts(attachedContracts)
      .callParams({
        forward: [user0RemoveAmount.toString(), LP_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 7, 1);

  // User1 removes all their liquidity
  await call(
    vaultUser1.functions
      .remove_liquidity(user1Identity)
      .addContracts(attachedContracts)
      .callParams({
        forward: [user1LpBalance.toString(), LP_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 15, 1);

  // User0 removes remaining liquidity
  const user0RemainingLpBalance = await user0Wallet.getBalance(LP_ASSET_ID);
  await call(
    vaultUser0.functions
      .remove_liquidity(user0Identity)
      .addContracts(attachedContracts)
      .callParams({
        forward: [user0RemainingLpBalance.toString(), LP_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 9, 1);

  // User2 adds more liquidity (2000 USDC)
  await call(
    vaultUser2.functions
      .add_liquidity(user2Identity)
      .addContracts(attachedContracts)
      .callParams({
        forward: [expandDecimals(2000), USDC_ASSET_ID],
      })
  );
  await moveBlockchainTime(provider, 11, 1);
}
