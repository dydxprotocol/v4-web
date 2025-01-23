import { arbitrum, base, mainnet, optimism, polygon } from 'viem/chains';

import { CosmosChainId } from './graz';
import { SOLANA_MAINNET_ID } from './solana';
import { WalletNetworkType } from './wallets';

type Chain = {
  name: string;
  icon: string;
  walletNetworkType: WalletNetworkType;
};

export const CHAIN_INFO: { [chainId: string]: Chain } = {
  [mainnet.id]: {
    name: 'Ethereum',
    icon: '/chains/ethereum.png',
    walletNetworkType: WalletNetworkType.Evm,
  },
  [arbitrum.id]: {
    name: 'Arbitrum',
    icon: '/chains/arbitrum.png',
    walletNetworkType: WalletNetworkType.Evm,
  },
  [optimism.id]: {
    name: 'Optimism',
    icon: '/chains/optimism.png',
    walletNetworkType: WalletNetworkType.Evm,
  },
  [base.id]: {
    name: 'Base',
    icon: '/chains/base.png',
    walletNetworkType: WalletNetworkType.Evm,
  },
  [polygon.id]: {
    name: 'Polygon',
    icon: '/chains/polygon.png',
    walletNetworkType: WalletNetworkType.Evm,
  },
  [SOLANA_MAINNET_ID]: {
    name: 'Solana',
    icon: '/chains/solana.png',
    walletNetworkType: WalletNetworkType.Solana,
  },
  [CosmosChainId.Neutron]: {
    name: 'Neutron',
    icon: '/chains/neutron.png',
    walletNetworkType: WalletNetworkType.Cosmos,
  },
  [CosmosChainId.Noble]: {
    name: 'Noble',
    icon: '/chains/noble.png',
    walletNetworkType: WalletNetworkType.Cosmos,
  },
  [CosmosChainId.Osmosis]: {
    name: 'Osmosis',
    icon: '/chains/osmosis.png',
    walletNetworkType: WalletNetworkType.Cosmos,
  },
};

export const EVM_DEPOSIT_CHAINS = [mainnet, base, optimism, arbitrum, polygon];
export function isEvmDepositChainId(chainId: string) {
  return EVM_DEPOSIT_CHAINS.map((chain) => String(chain.id)).includes(chainId);
}

export const DYDX_DEPOSIT_CHAIN = 'dydx-mainnet-1';
