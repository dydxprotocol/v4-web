import { arbitrum, avalanche, base, mainnet, optimism, polygon } from 'viem/chains';

import { CosmosChainId } from './graz';
import { SOLANA_MAINNET_ID } from './solana';
import { WalletNetworkType } from './wallets';

type Chain = {
  name: string;
  icon: string;
  walletNetworkType: WalletNetworkType;
  gasDenom: string;
  explorerBaseUrl: string;
};

export const CHAIN_INFO: { [chainId: string]: Chain } = {
  [mainnet.id]: {
    name: 'Ethereum',
    icon: '/chains/ethereum.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'ETH',
    explorerBaseUrl: 'https://etherscan.io',
  },
  [arbitrum.id]: {
    name: 'Arbitrum',
    icon: '/chains/arbitrum.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'ETH',
    explorerBaseUrl: 'https://arbiscan.io',
  },
  [optimism.id]: {
    name: 'Optimism',
    icon: '/chains/optimism.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'ETH',
    explorerBaseUrl: 'https://optimistic.etherscan.io',
  },
  [base.id]: {
    name: 'Base',
    icon: '/chains/base.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'ETH',
    explorerBaseUrl: 'https://basescan.org',
  },
  [polygon.id]: {
    name: 'Polygon',
    icon: '/chains/polygon.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'POL',
    explorerBaseUrl: 'https://polygonscan.com',
  },
  [avalanche.id]: {
    name: 'Avalanche',
    icon: '/chains/avalanche.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'AVAX',
    explorerBaseUrl: 'https://snowtrace.io',
  },
  [SOLANA_MAINNET_ID]: {
    name: 'Solana',
    icon: '/chains/solana.png',
    walletNetworkType: WalletNetworkType.Solana,
    gasDenom: 'SOL',
    explorerBaseUrl: 'https://explorer.solana.com',
  },
  [CosmosChainId.Neutron]: {
    name: 'Neutron',
    icon: '/chains/neutron.png',
    walletNetworkType: WalletNetworkType.Cosmos,
    gasDenom: 'NTRN',
    explorerBaseUrl: 'https://mintscan.io/neutron',
  },
  [CosmosChainId.Noble]: {
    name: 'Noble',
    icon: '/chains/noble.png',
    walletNetworkType: WalletNetworkType.Cosmos,
    gasDenom: 'USDC',
    explorerBaseUrl: 'https://mintscan.io/noble',
  },
  [CosmosChainId.Osmosis]: {
    name: 'Osmosis',
    icon: '/chains/osmosis.png',
    walletNetworkType: WalletNetworkType.Cosmos,
    gasDenom: 'OSMO',
    explorerBaseUrl: 'https://mintscan.io/osmosis',
  },
};

export const EVM_DEPOSIT_CHAINS = [mainnet, base, optimism, arbitrum, polygon, avalanche];
export function isEvmDepositChainId(chainId: string) {
  return EVM_DEPOSIT_CHAINS.map((chain) => String(chain.id)).includes(chainId);
}

export const NEAR_INSTANT_DEPOSIT_CHAINS = [
  SOLANA_MAINNET_ID,
  CosmosChainId.Noble,
  CosmosChainId.Osmosis,
  CosmosChainId.Neutron,
  polygon.id.toString(),
  avalanche.id.toString(),
];

export const DYDX_DEPOSIT_CHAIN = 'dydx-mainnet-1';
