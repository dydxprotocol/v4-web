export enum DydxV4Network {
  V4Mainnet = 'dydxprotocol-mainnet',
  V4Staging = 'dydxprotocol-staging',
  V4Testnet2 = 'dydxprotocol-testnet-2',
  V4Local = 'dydxprotocol-dev',
}

export enum DydxV3Network {
  V3Mainnet = '1',
  V3Testnet = '5',
}

export function isDydxV4Network(network: any): network is DydxV4Network {
  return Object.values(DydxV4Network).includes(network);
}

export function isValidDydxNetwork(network: any): boolean {
  return isDydxV4Network(network) || Object.values(DydxV3Network).includes(network);
}

export type DydxNetwork = DydxV4Network | DydxV3Network;

export const CHAIN_IDS = {
  [DydxV4Network.V4Mainnet]: '',
  [DydxV4Network.V4Staging]: 'dydxprotocol-testnet',
  [DydxV4Network.V4Testnet2]: 'dydx-testnet-2',
  [DydxV4Network.V4Local]: 'dydxprotocol-testnet',
  [DydxV3Network.V3Mainnet]: '1',
  [DydxV3Network.V3Testnet]: '5',
};

export const DEFAULT_APP_ENVIRONMENT =
  import.meta.env.MODE === 'production' ? DydxV4Network.V4Testnet2 : DydxV4Network.V4Staging;

export const CLIENT_NETWORK_CONFIGS: Record<
  DydxV4Network,
  {
    chainId: string;
    validatorUrl: string;
    faucetUrl: string;
    indexerUrl: string;
    ethereumChainId: number;
  }
> = {
  [DydxV4Network.V4Mainnet]: {
    chainId: CHAIN_IDS[DydxV4Network.V4Mainnet],
    validatorUrl: import.meta.env.VITE_VALIDATOR_URL_STAGE,
    faucetUrl: import.meta.env.VITE_FAUCET_URL_STAGE,
    indexerUrl: import.meta.env.VITE_INDEXER_URL_STAGE,
    ethereumChainId: 1,
  },
  [DydxV4Network.V4Local]: {
    chainId: CHAIN_IDS[DydxV4Network.V4Local],
    validatorUrl: import.meta.env.VITE_VALIDATOR_URL_DEV,
    faucetUrl: import.meta.env.VITE_FAUCET_URL_DEV,
    indexerUrl: import.meta.env.VITE_INDEXER_URL_DEV,
    ethereumChainId: 5,
  },
  [DydxV4Network.V4Staging]: {
    chainId: CHAIN_IDS[DydxV4Network.V4Staging],
    validatorUrl: import.meta.env.VITE_VALIDATOR_URL_STAGE,
    faucetUrl: import.meta.env.VITE_FAUCET_URL_STAGE,
    indexerUrl: import.meta.env.VITE_INDEXER_URL_STAGE,
    ethereumChainId: 5,
  },
  [DydxV4Network.V4Testnet2]: {
    chainId: CHAIN_IDS[DydxV4Network.V4Testnet2],
    validatorUrl: import.meta.env.VITE_VALIDATOR_URL_TESTNET2,
    faucetUrl: import.meta.env.VITE_FAUCET_URL_TESTNET2,
    indexerUrl: import.meta.env.VITE_INDEXER_URL_TESTNET2,
    ethereumChainId: 5,
  },
};
