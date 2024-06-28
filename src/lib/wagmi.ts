// Custom connectors
import type { PrivyClientConfig } from '@privy-io/react-auth';
import { createConfig } from '@privy-io/wagmi';
import { EIP1193Provider, FallbackTransport, Transport, http, type Chain } from 'viem';
import {
  arbitrum,
  arbitrumGoerli,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  base,
  baseGoerli,
  baseSepolia,
  bsc,
  bscTestnet,
  celo,
  celoAlfajores,
  fantom,
  fantomTestnet,
  filecoin,
  filecoinHyperspace,
  goerli,
  kava,
  linea,
  lineaTestnet,
  mainnet,
  mantle,
  mantleTestnet,
  moonbaseAlpha,
  moonbeam,
  optimism,
  optimismGoerli,
  optimismSepolia,
  polygon,
  polygonAmoy,
  polygonMumbai,
  scroll,
  sepolia,
} from 'viem/chains';
import { fallback } from 'wagmi';
import {
  coinbaseWallet as coinbaseWalletConnector,
  injected as injectedConnector,
  walletConnect as walletConnectConnector,
} from 'wagmi/connectors';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import {
  WALLET_CONNECT_EXPLORER_RECOMMENDED_IDS,
  WalletConnectionType,
  wallets,
  type WalletConnection,
  type WalletType,
} from '@/constants/wallets';

import { isTruthy } from './isTruthy';
import { getLocalStorage } from './localStorage';
import { validateAgainstAvailableEnvironments } from './network';

// Config

const WAGMI_SUPPORTED_CHAINS: Chain[] = [
  goerli,
  sepolia,
  arbitrum,
  arbitrumSepolia,
  arbitrumGoerli,
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
  optimism,
  optimismSepolia,
  optimismGoerli,
  base,
  baseSepolia,
  baseGoerli,
  polygon,
  polygonAmoy,
  polygonMumbai,
  linea,
  lineaTestnet,
  mantle,
  mantleTestnet,
  moonbeam,
  moonbaseAlpha,
  filecoin,
  filecoinHyperspace,
  fantom,
  fantomTestnet,
  celo,
  celoAlfajores,
  scroll,
  kava,
];

const getAlchemyRPCUrls = (chainId: string, apiKey: string) => {
  switch (chainId) {
    case '1':
      return `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;
    case '11155111':
      return `https://eth-sepolia.g.alchemy.com/v2/${apiKey}`;
    case '137':
      return `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/${apiKey}`;
    case '10':
      return `https://opt-mainnet.g.alchemy.com/v2/${apiKey}`;
    case '11155420':
      return `https://opt-sepolia.g.alchemy.com/v2/${apiKey}`;
    case '42161':
      return `https://arb-mainnet.g.alchemy.com/v2/${apiKey}`;
    case '421614':
      return `https://arb-sepolia.g.alchemy.com/v2/${apiKey}`;
    case '8453':
      return `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;
    case '84532':
      return `https://base-sepolia.g.alchemy.com/v2/${apiKey}`;
    default:
      return undefined;
  }
};

const RPCTransports = WAGMI_SUPPORTED_CHAINS.reduce(
  (transports, chain) => {
    const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY;
    const alchemyRPCUrls = alchemyKey && getAlchemyRPCUrls(chain.id.toString(), alchemyKey);
    transports[chain.id] = fallback(
      [alchemyRPCUrls && http(alchemyRPCUrls), http(chain.rpcUrls.default.http[0]), http()].filter(
        isTruthy
      )
    );
    return transports;
  },
  {} as Record<string, FallbackTransport<Transport[]>>
);

const defaultSelectedNetwork = getLocalStorage({
  key: LocalStorageKey.SelectedNetwork,
  defaultValue: DEFAULT_APP_ENVIRONMENT,
  validateFn: validateAgainstAvailableEnvironments,
});
const defaultChainId = Number(ENVIRONMENT_CONFIG_MAP[defaultSelectedNetwork].ethereumChainId);

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    requireUserPasswordOnCreate: false,
    noPromptOnSignature: true,
  },
  appearance: {
    theme: '#28283c',
  },
  defaultChain: defaultChainId === mainnet.id ? mainnet : sepolia,
};

type WalletConnectConfig = {
  client: {
    name: string;
    description: string;
    iconUrl: string;
  };
  v2: {
    projectId: string;
  };
};

const getWalletconnect2ConnectorOptions = (
  config: WalletConnectConfig
): Parameters<typeof walletConnectConnector>[0] => ({
  projectId: config.v2.projectId,
  metadata: {
    name: config.client.name,
    description: config.client.description,
    url: import.meta.env.VITE_BASE_URL,
    icons: [config.client.iconUrl],
  },
  showQrModal: true,
  qrModalOptions: {
    themeMode: 'dark' as const,
    themeVariables: {
      // TODO: figure out why --wcm-accent-color isn't considered a known property
      // @ts-ignore
      '--wcm-accent-color': '#5973fe',
      '--wcm-font-family': 'var(--fontFamily-base)',
    },
    explorerRecommendedWalletIds: WALLET_CONNECT_EXPLORER_RECOMMENDED_IDS,
  },
});

const getConnectors = (
  walletConnectConfig: WalletConnectConfig,
  walletconnectionType: WalletConnectionType
) => {
  switch (walletconnectionType) {
    case WalletConnectionType.CoinbaseWalletSdk: {
      return coinbaseWalletConnector({
        appName: 'dYdX',
        reloadOnDisconnect: false,
      });
    }
    case WalletConnectionType.InjectedEip1193: {
      return injectedConnector();
    }
    case WalletConnectionType.WalletConnect2: {
      return walletConnectConnector(getWalletconnect2ConnectorOptions(walletConnectConfig));
    }
    default: {
      return injectedConnector();
    }
  }
};

export const config = createConfig({
  chains: [mainnet, ...WAGMI_SUPPORTED_CHAINS],
  transports: RPCTransports,
});

// Create a custom wagmi InjectedConnector using a specific injected EIP-1193 provider (instead of wagmi's default detection logic)
const createInjectedConnectorWithProvider = (provider: EIP1193Provider) => {
  return injectedConnector({
    target: {
      id: 'windowProvider',
      name: 'Injected',
      provider,
    },
  });
};

const createWalletConnect2ConnectorWithId = (
  walletconnectId: string,
  walletConnectConfig: WalletConnectConfig
) => {
  const walletconnect2ConnectorOptions = getWalletconnect2ConnectorOptions(walletConnectConfig);
  return walletConnectConnector({
    ...walletconnect2ConnectorOptions,
    qrModalOptions: {
      ...walletconnect2ConnectorOptions.qrModalOptions,
      explorerRecommendedWalletIds: [walletconnectId],
      explorerExcludedWalletIds: 'ALL',
    },
  });
};

// Custom connector from wallet selection

export const resolveWagmiConnector = ({
  walletType,
  walletConnection,
  walletConnectConfig,
}: {
  walletType: WalletType;
  walletConnection: WalletConnection;
  walletConnectConfig: WalletConnectConfig;
}) => {
  const walletConfig = wallets[walletType];

  return walletConnection.type === WalletConnectionType.InjectedEip1193 && walletConnection.provider
    ? createInjectedConnectorWithProvider(walletConnection.provider)
    : walletConnection.type === WalletConnectionType.WalletConnect2 && walletConfig.walletconnect2Id
      ? createWalletConnect2ConnectorWithId(walletConfig.walletconnect2Id, walletConnectConfig)
      : getConnectors(walletConnectConfig, walletConnection.type);
};
