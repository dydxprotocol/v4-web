import { createConfig, configureChains, mainnet, Chain, Connector, usePublicClient } from 'wagmi';
import { goerli } from 'wagmi/chains';

import {
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
} from 'viem/chains';

import { alchemyProvider } from 'wagmi/providers/alchemy';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { publicProvider } from 'wagmi/providers/public';

import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { WalletConnectLegacyConnector } from 'wagmi/connectors/walletConnectLegacy';

// Config

export const WAGMI_SUPPORTED_CHAINS: Chain[] = [
  mainnet,
  goerli,

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
];

const { chains, publicClient, webSocketPublicClient } = configureChains(WAGMI_SUPPORTED_CHAINS, [
  alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY }),
  jsonRpcProvider({
    rpc: (chain) => ({ http: chain.rpcUrls.default.http[0] }),
  }),
  publicProvider(),
]);

const injectedConnectorOptions = {
  chains,
  options: {
    name: 'Injected',
    shimDisconnect: true,
    shimChainChangedDisconnect: false,
  },
};

const walletconnect1ConnectorOptions = {
  chains,
  options: {
    bridge: import.meta.env.VITE_WALLETCONNECT1_BRIDGE,
    qrcode: true,
  },
};

const walletconnect2ConnectorOptions: ConstructorParameters<typeof WalletConnectConnector>[0] = {
  chains,
  options: {
    projectId: import.meta.env.VITE_WALLETCONNECT2_PROJECT_ID,
    metadata: {
      // TODO: update to local URLs/images
      name: 'dYdX',
      description: '',
      url: 'https://trade.dydx.exchange',
      icons: ['https://trade.dydx.exchange/cbw-image.png'],
    },
    showQrModal: true,
    qrModalOptions: {
      themeMode: 'dark' as const,
      themeVariables: {
        '--w3m-accent-color': '#5973fe',
        '--w3m-background-color': '#5973fe',
        '--w3m-color-bg-1': 'var(--color-layer-3)',
        '--w3m-color-bg-2': 'var(--color-layer-4)',
        '--w3m-color-bg-3': 'var(--color-layer-5)',
        '--w3m-font-family': 'var(--fontFamily-base)',
        '--w3m-font-feature-settings': 'none',
        '--w3m-overlay-backdrop-filter': 'blur(6px)',
        // '--w3m-logo-image-url': 'https://trade.dydx.exchange/cbw-image.png',
      },
      enableExplorer: true,
      explorerAllowList: [],
      explorerDenyList: [],
      chainImages: {},
    },
  },
};

const connectors = [
  new MetaMaskConnector({
    chains,
    options: {
      shimDisconnect: true,
      shimChainChangedDisconnect: false,
    },
  }),
  new CoinbaseWalletConnector({
    chains,
    options: {
      appName: 'wagmi',
      reloadOnDisconnect: false,
    },
  }),
  new WalletConnectLegacyConnector(walletconnect1ConnectorOptions),
  new WalletConnectConnector(walletconnect2ConnectorOptions),
  new InjectedConnector(injectedConnectorOptions),
];

export const config = createConfig({
  autoConnect: true,
  // connectors,
  publicClient,
  webSocketPublicClient,
});

// Custom connectors

import type { ExternalProvider } from '@ethersproject/providers';

// Create a custom wagmi InjectedConnector using a specific injected EIP-1193 provider (instead of wagmi's default detection logic)
const createInjectedConnectorWithProvider = (provider: ExternalProvider) =>
  new (class extends InjectedConnector {
    getProvider = async () =>
      provider as unknown as Awaited<ReturnType<InjectedConnector['getProvider']>>;
  })(injectedConnectorOptions) as InjectedConnector;

// Create a custom wagmi WalletConnectLegacyConnector with a modal showing only wallet links matching the given name
const createWalletConnect1ConnectorWithName = (walletconnect1Name: string) =>
  new WalletConnectLegacyConnector({
    ...walletconnect1ConnectorOptions,
    options: {
      ...walletconnect1ConnectorOptions.options,
      qrcodeModalOptions: {
        desktopLinks: [walletconnect1Name],
        mobileLinks: [walletconnect1Name],
      },
    },
  });

const createWalletConnect2ConnectorWithId = (walletconnect2Id: string) =>
  new WalletConnectConnector({
    ...walletconnect2ConnectorOptions,
    options: {
      ...walletconnect2ConnectorOptions.options,
      qrModalOptions: {
        ...walletconnect2ConnectorOptions.options.qrModalOptions,
        explorerRecommendedWalletIds: [walletconnect2Id],
        explorerExcludedWalletIds: 'ALL',
        chainImages: {},
      },
    },
  });

// Custom connector from wallet selection
import {
  type WalletConnection,
  WalletConnectionType,
  type WalletType,
  walletConnectionTypes,
  wallets,
} from '@/constants/wallets';

export const resolveWagmiConnector = ({
  walletType,
  walletConnection,
}: {
  walletType: WalletType;
  walletConnection: WalletConnection;
}) => {
  const walletConfig = wallets[walletType];
  const walletConnectionConfig = walletConnectionTypes[walletConnection.type];

  return walletConnection.type === WalletConnectionType.InjectedEip1193 && walletConnection.provider
    ? createInjectedConnectorWithProvider(walletConnection.provider)
    : walletConnection.type === WalletConnectionType.WalletConnect1 &&
      walletConfig.walletconnect1Name
    ? createWalletConnect1ConnectorWithName(walletConfig.walletconnect1Name)
    : walletConnection.type === WalletConnectionType.WalletConnect2 && walletConfig.walletconnect2Id
    ? createWalletConnect2ConnectorWithId(walletConfig.walletconnect2Id)
    : connectors.find(({ id }: { id: string }) => id === walletConnectionConfig.wagmiConnectorId);
};
