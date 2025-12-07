import { Provider, Wallet } from 'fuels';

// eslint-disable-next-line import/no-relative-packages
import { StorkMock } from '../../contracts/types';
import {
  call,
  getArgs,
  moveBlockchainTime,
  toPrice,
  BTC_ASSET,
  USDC_ASSET,
  ETH_ASSET,
} from './utils';

// priv keys are hardcoded, taken form the fuel node starting script
const deployerPK = '0x9e42fa83bda35cbc769c4b058c721adef68011d7945d0b30165397ec6d05a53a'; // 0x0a0da2e1d4d201cc73cd500dfd64a732f1b94e5fb2d86657ab43ff620acaefd6

// graphql url is hardcoded, taken form the fuel node starting script
const graphQLUrl = 'http://127.0.0.1:4000/v1/graphql';

if (require.main === module) {
  populateEvents(getArgs(['mockPricefeedAddress', 'vaultAddress', 'usdcAddress']))
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

  const storkMockDeployer = new StorkMock(taskArgs.mockPricefeedAddress, deployerWallet);

  // custom code, populate the events
  await call(storkMockDeployer.functions.update_price(USDC_ASSET, toPrice(1)));
  await call(storkMockDeployer.functions.update_price(ETH_ASSET, toPrice(3000)));

  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45100)));
  await moveBlockchainTime(provider, 2, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44800)));
  await moveBlockchainTime(provider, 12, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44850)));
  await moveBlockchainTime(provider, 5, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44800)));
  await moveBlockchainTime(provider, 3, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44700)));
  await moveBlockchainTime(provider, 10, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44750)));
  await moveBlockchainTime(provider, 7, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44800)));
  await moveBlockchainTime(provider, 19, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44850)));
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(44900)));
  await moveBlockchainTime(provider, 9, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45000)));
  await moveBlockchainTime(provider, 21, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45050)));
  await moveBlockchainTime(provider, 6, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45150)));
  await moveBlockchainTime(provider, 13, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45100)));
  await moveBlockchainTime(provider, 8, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45300)));
  await moveBlockchainTime(provider, 25, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45250)));
  await moveBlockchainTime(provider, 12, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45200)));
  await moveBlockchainTime(provider, 3, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45550)));
  await moveBlockchainTime(provider, 16, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45300)));
  await moveBlockchainTime(provider, 11, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45250)));
  await moveBlockchainTime(provider, 23, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45350)));

  await call(storkMockDeployer.functions.update_price(USDC_ASSET, toPrice(1)));
  await call(storkMockDeployer.functions.update_price(ETH_ASSET, toPrice(3000)));
}
