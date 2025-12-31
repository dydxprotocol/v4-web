import { Provider, Wallet } from 'fuels';
import { StorkMock } from '../../contracts/types/index.js';
import {
  BTC_ASSET,
  DEPLOYER_PK,
  ETH_ASSET,
  USDC_ASSET,
  call,
  moveBlockchainTime,
  toPrice,
} from './utils';

// graphql url is hardcoded, taken form the fuel node starting script
const graphQLUrl = 'http://127.0.0.1:4000/v1/graphql';

if (import.meta.url === `file://${process.argv[1]}`) {
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

  if (!mockPricefeedAddress) {
    throw new Error('Missing required environment variable: MOCK_STORK_CONTRACT');
  }

  const provider = new Provider(graphQLUrl);

  // preparation, usually the same for all the populate scripts
  const deployerWallet = Wallet.fromPrivateKey(DEPLOYER_PK, provider);

  const storkMockDeployer = new StorkMock(mockPricefeedAddress, deployerWallet);

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

  await moveBlockchainTime(provider, 14, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45420)));
  await moveBlockchainTime(provider, 5, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45510)));
  await moveBlockchainTime(provider, 9, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45480)));
  await moveBlockchainTime(provider, 13, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45600)));
  await moveBlockchainTime(provider, 4, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45570)));
  await moveBlockchainTime(provider, 11, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45720)));
  await moveBlockchainTime(provider, 7, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45650)));
  await moveBlockchainTime(provider, 10, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45810)));
  await moveBlockchainTime(provider, 6, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45790)));
  await moveBlockchainTime(provider, 12, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45950)));
  await moveBlockchainTime(provider, 8, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46020)));
  await moveBlockchainTime(provider, 15, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(45980)));
  await moveBlockchainTime(provider, 9, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46100)));
  await moveBlockchainTime(provider, 7, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46040)));
  await moveBlockchainTime(provider, 14, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46150)));
  await moveBlockchainTime(provider, 6, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46210)));
  await moveBlockchainTime(provider, 10, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46130)));
  await moveBlockchainTime(provider, 16, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46280)));
  await moveBlockchainTime(provider, 5, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46350)));
  await moveBlockchainTime(provider, 11, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46270)));
  await moveBlockchainTime(provider, 7, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46390)));
  await moveBlockchainTime(provider, 13, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46420)));
  await moveBlockchainTime(provider, 9, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46310)));
  await moveBlockchainTime(provider, 12, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46480)));
  await moveBlockchainTime(provider, 8, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46520)));
  await moveBlockchainTime(provider, 15, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46460)));
  await moveBlockchainTime(provider, 6, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46590)));
  await moveBlockchainTime(provider, 10, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46630)));
  await moveBlockchainTime(provider, 7, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46570)));
  await moveBlockchainTime(provider, 14, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46680)));
  await moveBlockchainTime(provider, 5, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46750)));
  await moveBlockchainTime(provider, 11, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46690)));
  await moveBlockchainTime(provider, 9, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46810)));
  await moveBlockchainTime(provider, 12, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46760)));
  await moveBlockchainTime(provider, 8, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46890)));
  await moveBlockchainTime(provider, 13, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46940)));
  await moveBlockchainTime(provider, 6, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46870)));
  await moveBlockchainTime(provider, 15, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47010)));
  await moveBlockchainTime(provider, 7, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(46980)));
  await moveBlockchainTime(provider, 14, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47090)));
  await moveBlockchainTime(provider, 5, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47130)));
  await moveBlockchainTime(provider, 11, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47070)));
  await moveBlockchainTime(provider, 9, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47180)));
  await moveBlockchainTime(provider, 12, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47220)));
  await moveBlockchainTime(provider, 8, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47160)));
  await moveBlockchainTime(provider, 13, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47290)));
  await moveBlockchainTime(provider, 6, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47240)));
  await moveBlockchainTime(provider, 15, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47310)));
  await moveBlockchainTime(provider, 7, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47360)));
  await moveBlockchainTime(provider, 10, 1);
  await call(storkMockDeployer.functions.update_price(BTC_ASSET, toPrice(47300)));

  await call(storkMockDeployer.functions.update_price(USDC_ASSET, toPrice(1)));
  await call(storkMockDeployer.functions.update_price(ETH_ASSET, toPrice(3000)));
}
