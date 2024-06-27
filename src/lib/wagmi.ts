// Custom connectors
import type { ExternalProvider } from '@ethersproject/providers';
import type { PrivyClientConfig } from '@privy-io/react-auth';
import {
  arbitrum,
  arbitrumGoerli,
  avalanche,
  avalancheFuji,
  base,
  baseGoerli,
  bsc,
  bscTestnet,
  celo,
  celoAlfajores,
  fantom,
  fantomTestnet,
  filecoin,
  filecoinHyperspace,
  kava,
  linea,
  lineaTestnet,
  mantle,
  mantleTestnet,
  moonbaseAlpha,
  moonbeam,
  optimism,
  optimismGoerli,
  polygon,
  polygonMumbai,
  scroll,
  sepolia,
} from 'viem/chains';
import { Chain, configureChains, createConfig, mainnet } from 'wagmi';
import { goerli } from 'wagmi/chains';
import {
  coinbaseWallet as CoinbaseWalletConnector,
  injected as InjectedConnector,
  metaMask as MetaMaskConnector,
  walletConnect as WalletConnectConnector,
} from 'wagmi/connectors';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import {
  WALLET_CONNECT_EXPLORER_RECOMMENDED_IDS,
  WalletConnectionType,
  walletConnectionTypes,
  wallets,
  type WalletConnection,
  type WalletType,
} from '@/constants/wallets';

import { isTruthy } from './isTruthy';
import { getLocalStorage } from './localStorage';
import { validateAgainstAvailableEnvironments } from './network';

// Config

const WAGMI_SUPPORTED_CHAINS: Chain[] = [
  mainnet,
  goerli,
  sepolia,
  arbitrum,
  arbitrumGoerli,
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
  optimism,
  optimismGoerli,
  base,
  baseGoerli,
  polygon,
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
      return `eth-mainnet.alchemyapi.io/v2/${apiKey}`;
    case '11155111':
      return `eth-sepolia.alchemyapi.io/v2/${apiKey}`;
    case '137':
      return `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;
    case '80002':
      return `https://polygon-amoy.g.alchemy.com/v2/your-alchemy-api-key`;

    default:
      return undefined;
  }
};

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

export const configureChainsConfig = configureChains(
  WAGMI_SUPPORTED_CHAINS,
  [
    import.meta.env.VITE_ALCHEMY_API_KEY &&
      alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY }),
    jsonRpcProvider({
      rpc: (chain) => ({ http: chain.rpcUrls.default.http[0] }),
    }),
    publicProvider(),
  ].filter(isTruthy)
);
const { chains, publicClient, webSocketPublicClient } = configureChainsConfig;

const injectedConnectorOptions = {
  chains,
  options: {
    name: 'Injected',
    shimDisconnect: true,
    shimChainChangedDisconnect: false,
  },
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
): ConstructorParameters<typeof WalletConnectConnector>[0] => ({
  chains,
  options: {
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
  },
});

const getConnectors = (walletConnectConfig: WalletConnectConfig) => [
  new MetaMaskConnector({
    chains,
    options: {
      shimDisconnect: true,
    },
  }),
  new CoinbaseWalletConnector({
    chains,
    options: {
      appName: 'dYdX',
      reloadOnDisconnect: false,
    },
  }),
  new WalletConnectConnector(getWalletconnect2ConnectorOptions(walletConnectConfig)),
  new InjectedConnector(injectedConnectorOptions),
];

export const config = createConfig({
  // connectors,
  publicClient,
  webSocketPublicClient,
});

// Create a custom wagmi InjectedConnector using a specific injected EIP-1193 provider (instead of wagmi's default detection logic)
const createInjectedConnectorWithProvider = (provider: ExternalProvider) =>
  new (class extends InjectedConnector {
    getProvider = async () =>
      provider as unknown as Awaited<ReturnType<InjectedConnector['getProvider']>>;
  })(injectedConnectorOptions) as InjectedConnector;

const createWalletConnect2ConnectorWithId = (
  walletconnectId: string,
  walletConnectConfig: WalletConnectConfig
) => {
  const walletconnect2ConnectorOptions = getWalletconnect2ConnectorOptions(walletConnectConfig);
  return new WalletConnectConnector({
    ...walletconnect2ConnectorOptions,
    options: {
      ...walletconnect2ConnectorOptions.options,
      qrModalOptions: {
        ...walletconnect2ConnectorOptions.options.qrModalOptions,
        explorerRecommendedWalletIds: [walletconnectId],
        explorerExcludedWalletIds: 'ALL',
      },
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
  const walletConnectionConfig = walletConnectionTypes[walletConnection.type];

  return walletConnection.type === WalletConnectionType.InjectedEip1193 && walletConnection.provider
    ? createInjectedConnectorWithProvider(walletConnection.provider)
    : walletConnection.type === WalletConnectionType.WalletConnect2 && walletConfig.walletconnect2Id
      ? createWalletConnect2ConnectorWithId(walletConfig.walletconnect2Id, walletConnectConfig)
      : getConnectors(walletConnectConfig).find(
          ({ id }: { id: string }) => id === walletConnectionConfig.wagmiConnectorId
        );
};
