// Custom connectors
import type { PrivyClientConfig } from '@privy-io/react-auth';
import { createConfig } from '@privy-io/wagmi';
import { FallbackTransport, http, Transport, type Chain } from 'viem';
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
  walletConnect as walletConnectConnector,
} from 'wagmi/connectors';

import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_APP_ENVIRONMENT, ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import {
  ConnectorType,
  WALLET_CONNECT_EXPLORER_RECOMMENDED_IDS,
  WalletInfo,
} from '@/constants/wallets';

import { getMipdConnectorByRdns } from '@/hooks/useMipdInjectedWallets';

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

export enum ChainId {
  ETH_MAINNET = '1',
  ETH_SEPOLIA = '11155111',
  POLYGON_MAINNET = '137',
  POLYGON_MUMBAI = '80002',
  OPT_MAINNET = '10',
  OPT_SEPOLIA = '11155420',
  ARB_MAINNET = '42161',
  ARB_SEPOLIA = '421614',
  BASE_MAINNET = '8453',
  BASE_SEPOLIA = '84532',
  AVALANCHE_MAINNET = '43114',
  AVALANCHE_FUJI = '43113',
}

export const getAlchemyRPCUrlForChainId = (chainId: ChainId) => {
  const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY;
  if (!alchemyKey) return undefined;
  switch (chainId) {
    case ChainId.ETH_MAINNET:
      return `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
    case ChainId.ETH_SEPOLIA:
      return `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
    case ChainId.POLYGON_MAINNET:
      return `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`;
    case ChainId.POLYGON_MUMBAI:
      return `https://polygon-amoy.g.alchemy.com/v2/${alchemyKey}`;
    case ChainId.OPT_MAINNET:
      return `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`;
    case ChainId.OPT_SEPOLIA:
      return `https://opt-sepolia.g.alchemy.com/v2/${alchemyKey}`;
    case ChainId.ARB_MAINNET:
      return `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`;
    case ChainId.ARB_SEPOLIA:
      return `https://arb-sepolia.g.alchemy.com/v2/${alchemyKey}`;
    case ChainId.BASE_MAINNET:
      return `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`;
    case ChainId.BASE_SEPOLIA:
      return `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`;
    case ChainId.AVALANCHE_MAINNET:
      return `https://avax-mainnet.g.alchemy.com/v2/${alchemyKey}`;
    case ChainId.AVALANCHE_FUJI:
      return `https://avax-fuji.g.alchemy.com/v2/${alchemyKey}`;
    default:
      return undefined;
  }
};

export const RPCUrlsByChainId = [mainnet, ...WAGMI_SUPPORTED_CHAINS].reduce(
  (chainIdToRpcMap, chain) => {
    const alchemyRPCUrl = getAlchemyRPCUrlForChainId(chain.id.toString() as ChainId);
    const defaultRPCUrl = chain.rpcUrls.default.http[0];
    return {
      [chain.id]: [alchemyRPCUrl, defaultRPCUrl].filter(isTruthy),
      ...chainIdToRpcMap,
    };
  },
  {} as { [key: string]: string[] | undefined }
);

const RPCTransports = [mainnet, ...WAGMI_SUPPORTED_CHAINS].reduce(
  (transports, chain) => {
    const rpcUrls = RPCUrlsByChainId[chain.id] ?? [];
    const rpcTransports = rpcUrls.map((rpcUrl) => http(rpcUrl));
    const rpcTransportsWithDefault = [...rpcTransports, http()].filter(isTruthy);
    transports[chain.id] = fallback(rpcTransportsWithDefault);
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

export const config = createConfig({
  chains: [mainnet, ...WAGMI_SUPPORTED_CHAINS],
  transports: RPCTransports,
});

// Custom connector from wallet selection
export const resolveWagmiConnector = ({
  wallet,
  walletConnectConfig,
}: {
  wallet: WalletInfo;
  walletConnectConfig: WalletConnectConfig;
}) => {
  if (wallet.connectorType === ConnectorType.Injected) {
    return getMipdConnectorByRdns(wallet.rdns);
  }

  if (wallet.connectorType === ConnectorType.Coinbase) {
    return coinbaseWalletConnector({
      appName: 'dYdX',
      reloadOnDisconnect: false,
      // disable Coinbase Smart Wallet because dydx-client currently doesn't handle EIP-6492 signatures
      preference: 'eoaOnly',
    });
  }

  if (wallet.connectorType === ConnectorType.WalletConnect) {
    return walletConnectConnector(getWalletconnect2ConnectorOptions(walletConnectConfig));
  }

  return undefined;
};

/* This method checks if the connection mechanism goes through wagmi */
export function isWagmiConnectorType(wallet: WalletInfo | undefined): boolean {
  if (!wallet) return false;

  return [ConnectorType.Injected, ConnectorType.Coinbase, ConnectorType.WalletConnect].includes(
    wallet.connectorType
  );
}

/* This method checks if the resolved wallet address is returned by wagmi */
export function isWagmiResolvedWallet(wallet: WalletInfo | undefined): boolean {
  return isWagmiConnectorType(wallet) || wallet?.connectorType === ConnectorType.Privy;
}
