import { RouteResponse, Squid } from '@0xsquid/sdk';
import type { GetRoute, ChainData, RouteData, TokenData } from '@0xsquid/sdk';

import { DEFAULT_APP_ENVIRONMENT, DydxV4Network } from '@/constants/networks';

import { log } from './telemetry';

/**
 * @todo dYdX chain will eventually be added to squidSDK as an option for toChain and
 * USDC from Noble chain will also be a possible toToken in the near future. We will
 * need to eventually change these constants.
 * */
const SQUID_TESTNET_ROUTE_DEFAULTS = {
  toChain: 'osmo-test-4', // Osmosis Testnet
  toToken: 'uausdc', // aUSDC
  enableForecall: true, // instant execution service, defaults to true
  quoteOnly: false, // optional, defaults to false
};

// This config is for dev only! Used for testing General Message Passing (route provided by 0xSquid)
const SQUID_TESTNET_AVAX_TO_AXELAR_WITH_GMP = {
  toChain: 'axelar-testnet-lisbon-3',
  toToken: 'uosmo',
  enableForecall: false,
  quoteOnly: false,
};

const SQUID_MAINNET_ROUTE_DEFAULTS = {
  toChain: 'osmosis-1', // Osmosis Testnet
  toToken: 'uusdc', // aUSDC
  enableForecall: true, // instant execution service, defaults to true
  quoteOnly: false, // optional, defaults to false
};

class SquidFactory {
  private client: Squid;
  private isInitialized: boolean;

  constructor(baseUrl: string) {
    this.client = new Squid({ baseUrl });
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      await this.client.init();
      this.isInitialized = true;
    } catch (error) {
      log('SquidFactory/init', error);
    }
  }

  getClient = () => this.client;
}

const squidClientTestnet = new SquidFactory('https://testnet.api.0xsquid.com'); // new SquidFactory('https://squid-2gwsw7ij1-0xsquid.vercel.app');
const squidClientMainnet = new SquidFactory('https://api.0xsquid.com');

const SQUID_CLIENT_BY_NETWORK: Record<DydxV4Network, SquidFactory> = {
  [DydxV4Network.V4Local]: squidClientTestnet,
  [DydxV4Network.V4Mainnet]: squidClientMainnet,
  [DydxV4Network.V4Staging]: squidClientTestnet,
  [DydxV4Network.V4Testnet2]: squidClientTestnet,
};

class SquidRouter {
  private client: Squid;
  private network: DydxV4Network;

  constructor() {
    this.network = DEFAULT_APP_ENVIRONMENT;
    this.client = SQUID_CLIENT_BY_NETWORK[this.network].getClient();
  }

  /**
   * @description the default destination chain/token and other hardcoded options
   */
  get SQUID_ROUTE_DEFAULTS() {
    return {
      [DydxV4Network.V4Local]: SQUID_TESTNET_ROUTE_DEFAULTS,
      [DydxV4Network.V4Staging]: SQUID_TESTNET_ROUTE_DEFAULTS,
      [DydxV4Network.V4Testnet2]: SQUID_TESTNET_ROUTE_DEFAULTS,
      [DydxV4Network.V4Mainnet]: SQUID_MAINNET_ROUTE_DEFAULTS,
    }[this.network];
  }

  /**
   * @description updates the client to the correct 0xSquid environment based on which dYdX v4 network is selected.
   * @param network dYdX v4 network that is currently selected
   */
  switchNetwork = (network: DydxV4Network) => {
    this.client = SQUID_CLIENT_BY_NETWORK[network].getClient();
  };

  /**
   * @description initializes the Squid client if it was not previously initialized (API request)
   */
  initializeClient = () => SQUID_CLIENT_BY_NETWORK[this.network].init();

  /**
   * @returns list of chains supported by Axelar
   */
  getChains = (): ChainData[] => this.client.chains;

  /**
   * @returns list of tokens supported by Axelar
   */
  getTokens = (): TokenData[] => this.client.tokens;

  /**
   * @param getRouteParams
   * @returns 0xSquid RouteData
   */
  getRoute = async (getRouteParams: GetRoute): Promise<RouteResponse> => {
    const resp = await this.client.getRoute(getRouteParams);
    return resp;
  };

  /**
   * @params {
   *  @route the 0xSquid RouteData
   *  @signer the EVM/Cosmos Signer used to sign the Axelar bridge
   * }
   * @returns transaction information after the route has been executed
   */
  executeRoute = async ({ route, signer }: { route: RouteData; signer: any }) => {
    const tx = await this.client.executeRoute({
      signer,
      route,
    });

    return await tx.wait();
  };
}

const squidRouter = new SquidRouter();

export default squidRouter;
