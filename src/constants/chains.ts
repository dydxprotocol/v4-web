import { arbitrum, avalanche, base, mainnet, optimism, polygon } from 'viem/chains';

import { WalletNetworkType } from './wallets';

type Chain = {
  name: string;
  icon: string;
  walletNetworkType: WalletNetworkType;
  gasDenom: string;
};

export const CHAIN_INFO: { [chainId: string]: Chain } = {
  [mainnet.id]: {
    name: 'Ethereum',
    icon: '/chains/ethereum.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'ETH',
  },
  [arbitrum.id]: {
    name: 'Arbitrum',
    icon: '/chains/arbitrum.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'ETH',
  },
  [optimism.id]: {
    name: 'Optimism',
    icon: '/chains/optimism.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'ETH',
  },
  [base.id]: {
    name: 'Base',
    icon: '/chains/base.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'ETH',
  },
  [polygon.id]: {
    name: 'Polygon',
    icon: '/chains/polygon.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'POL',
  },
  [avalanche.id]: {
    name: 'Avalanche',
    icon: '/chains/avalanche.png',
    walletNetworkType: WalletNetworkType.Evm,
    gasDenom: 'AVAX',
  },
};

export const EVM_DEPOSIT_CHAINS = [mainnet, base, optimism, arbitrum, polygon, avalanche];
export function isEvmDepositChainId(chainId: string) {
  return EVM_DEPOSIT_CHAINS.map((chain) => String(chain.id)).includes(chainId);
}

export const DYDX_DEPOSIT_CHAIN = 'dydx-mainnet-1';
