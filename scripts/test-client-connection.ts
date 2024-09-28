/**
 * HOW TO USE:
 * 1. go to root dir of repo
 * 2. > pnpm i (if you haven't already)
 * 3. > pnpx tsx scripts/test-client-connection.ts 2>&1 | tee -a client-connection-output.log
 * 4. read the console output to check for failures OR go to client-connection-output.log
 */
import {
  CompositeClient,
  IndexerConfig,
  Network,
  NobleClient,
  ValidatorConfig,
} from '@dydxprotocol/v4-client-js';

// taken from https://github.com/dydxopsdao/v4-web/blob/main/public/configs/v1/env.json
const params = {
  indexerUrl: 'https://indexer.dydx.trade',
  websocketUrl: 'wss://indexer.dydx.trade/v4/ws',
  validatorUrl: 'https://dydx-ops-rpc.kingnodes.com',
  chainId: 'dydx-mainnet-1',
  nobleValidatorUrl: 'https://noble-yx-rpc.polkachu.com/',
  USDC_DENOM: 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5',
  USDC_DECIMALS: 6,
  USDC_GAS_DENOM: 'uusdc',
  CHAINTOKEN_DENOM: 'adydx',
  CHAINTOKEN_DECIMALS: 18,
  txnMemo: 'test dydx',
};

/**
 * This class replicates the connectNetwork functionality of dydxChainTransactions.ts
 * We can't just import the class b/c we're running these scripts via node which doesn't
 * play well with all imports we have.
 */
class TestClass {
  compositeClient: CompositeClient | undefined;

  nobleClient: NobleClient | undefined;

  nobleWallet: any;

  constructor() {
    this.compositeClient = undefined;
  }

  async connectNetwork(paramsInJson: any, callback: any): Promise<void> {
    callback('attempt number:');
    try {
      const parsedParams = paramsInJson;
      const {
        indexerUrl,
        websocketUrl,
        validatorUrl,
        chainId,
        nobleValidatorUrl,
        USDC_DENOM,
        USDC_DECIMALS,
        USDC_GAS_DENOM,
        CHAINTOKEN_DENOM,
        CHAINTOKEN_DECIMALS,
      } = parsedParams;
      callback('constructing and connecting composite client');
      const compositeClient = await CompositeClient.connect(
        new Network(
          chainId,
          new IndexerConfig(indexerUrl, websocketUrl),
          new ValidatorConfig(
            validatorUrl,
            chainId,
            {
              USDC_DENOM,
              USDC_DECIMALS,
              USDC_GAS_DENOM,
              CHAINTOKEN_DENOM,
              CHAINTOKEN_DECIMALS,
            },
            {
              broadcastPollIntervalMs: 3_000,
              broadcastTimeoutMs: 60_000,
            },
            'test transaction for debugging client connection'
          )
        )
      );
      callback('composite client successfully constructed and CONNECTED');
      this.compositeClient = compositeClient;
      try {
        if (nobleValidatorUrl) {
          this.nobleClient = new NobleClient(nobleValidatorUrl);
          callback('noble client successfully constructed (not connected YET)');
          if (this.nobleWallet) await this.nobleClient.connect(this.nobleWallet);
          callback('noble client successfully CONNECTED');
        }
      } catch (e) {
        callback('failed at DydxChainTransactions/connectNetwork/NobleClient', e);
      }

      /**
       * Dispatch custom event to notify other parts of the app that the network has been connected
       * CustomEvent is part of the browser API. We can makye a polyfill but it should be fine to
       * comment out for now.
       */
      // const customEvent = new CustomEvent('abacus:connectNetwork', {
      //   detail: parsedParams,
      // });

      // globalThis.dispatchEvent(customEvent);
      callback(JSON.stringify({ success: true }));
    } catch (error) {
      callback('failed at DydxChainTransactions/connectNetwork', error);
    }
  }
}

const t = new TestClass();
for (let i = 0; i < 100; i++) {
  t.connectNetwork(params, (...args) => console.log(...args, i));
}
