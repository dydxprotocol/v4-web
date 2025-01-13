import { arbitrum, base, mainnet, optimism, polygon } from 'viem/chains';

import { CosmosChainId } from './graz';
import { SOLANA_MAINNET_ID } from './solana';

type Chain = {
  name: string;
  icon: string;
};

export const CHAIN_INFO: { [chainId: string]: Chain } = {
  [mainnet.id]: {
    name: 'Ethereum',
    icon: '/chains/ethereum.png',
  },
  [arbitrum.id]: {
    name: 'Arbitrum',
    icon: '/chains/arbitrum.png',
  },
  [optimism.id]: {
    name: 'Optimism',
    icon: '/chains/optimism.png',
  },
  [base.id]: {
    name: 'Base',
    icon: '/chains/base.png',
  },
  [polygon.id]: {
    name: 'Polygon',
    icon: '/chains/polygon.png',
  },
  [SOLANA_MAINNET_ID]: {
    name: 'Solana',
    icon: '/chains/solana.png',
  },
  [CosmosChainId.Neutron]: {
    name: 'Neutron',
    icon: '/chains/neutron.png',
  },
  [CosmosChainId.Noble]: {
    name: 'Noble',
    icon: '/chains/noble.png',
  },
  [CosmosChainId.Osmosis]: {
    name: 'Osmosis',
    icon: '/chains/osmosis.png',
  },
};

export const EVM_DEPOSIT_CHAINS = [mainnet, base, optimism, arbitrum, polygon];

export const DYDX_DEPOSIT_CHAIN = 'dydx-mainnet-1';
