import { arbitrum, base, mainnet, optimism, polygon } from 'viem/chains';

import { CosmosChainId } from './graz';
import { SOLANA_MAINNET_ID } from './solana';

type Chain = {
  name: string;
};

export const CHAIN_INFO: { [chainId: string]: Chain } = {
  [mainnet.id]: {
    name: 'Ethereum',
  },
  [arbitrum.id]: {
    name: 'Arbitrum',
  },
  [optimism.id]: {
    name: 'Optimism',
  },
  [base.id]: {
    name: 'Base',
  },
  [polygon.id]: {
    name: 'Polygon',
  },
  [SOLANA_MAINNET_ID]: {
    name: 'Solana',
  },
  [CosmosChainId.Neutron]: {
    name: 'Neutron',
  },
  [CosmosChainId.Noble]: {
    name: 'Noble',
  },
  [CosmosChainId.Osmosis]: {
    name: 'Osmosis',
  },
};

export const EVM_DEPOSIT_CHAINS = [mainnet, base, optimism, arbitrum, polygon];
