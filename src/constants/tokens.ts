import { arbitrum, avalanche, base, mainnet, optimism, polygon } from 'viem/chains';

import { CosmosChainId } from './graz';
import { SOLANA_MAINNET_ID } from './solana';

// USDC has a assetId of 0 on the dYdX Chain
export const USDC_ASSET_ID = 0;

export const USDC_ADDRESSES = {
  [mainnet.id]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [optimism.id]: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
  [arbitrum.id]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [polygon.id]: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
  [avalanche.id]: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
  [SOLANA_MAINNET_ID]: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  [CosmosChainId.Noble]: 'uusdc',
  [CosmosChainId.Osmosis]: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
  [CosmosChainId.Neutron]: 'ibc/B559A80D62249C8AA07A380E2A2BEA6E5CA9A6F079C912C3A9E9B494105E4F81',
};

export const DYDX_CHAIN_USDC_DENOM =
  'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5';

export const USDC_DECIMALS = 6;
export const ETH_DECIMALS = 18;

export const SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112';

export type TokenForTransfer = {
  chainId: string;
  decimals: number;
  denom: string;
};

export type TokenBalance = {
  chainId: string;
  amount: string;
  formattedAmount: string;
  denom: string;
  decimals?: number;
  valueUSD?: string;
};

export const WITHDRAWABLE_ASSETS: TokenForTransfer[] = [
  {
    chainId: CosmosChainId.Noble,
    denom: USDC_ADDRESSES[CosmosChainId.Noble],
    decimals: USDC_DECIMALS,
  },
  { chainId: mainnet.id.toString(), denom: USDC_ADDRESSES[mainnet.id], decimals: USDC_DECIMALS },
  { chainId: arbitrum.id.toString(), denom: USDC_ADDRESSES[arbitrum.id], decimals: USDC_DECIMALS },
  { chainId: base.id.toString(), denom: USDC_ADDRESSES[base.id], decimals: USDC_DECIMALS },
  { chainId: optimism.id.toString(), denom: USDC_ADDRESSES[optimism.id], decimals: USDC_DECIMALS },
  { chainId: polygon.id.toString(), denom: USDC_ADDRESSES[polygon.id], decimals: USDC_DECIMALS },
  {
    chainId: avalanche.id.toString(),
    denom: USDC_ADDRESSES[avalanche.id],
    decimals: USDC_DECIMALS,
  },
  { chainId: SOLANA_MAINNET_ID, denom: USDC_ADDRESSES[SOLANA_MAINNET_ID], decimals: USDC_DECIMALS },
  {
    chainId: CosmosChainId.Neutron,
    denom: USDC_ADDRESSES[CosmosChainId.Neutron],
    decimals: USDC_DECIMALS,
  },
  {
    chainId: CosmosChainId.Osmosis,
    denom: USDC_ADDRESSES[CosmosChainId.Osmosis],
    decimals: USDC_DECIMALS,
  },
];
