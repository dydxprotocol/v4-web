import { arbitrum, base, mainnet, optimism, polygon } from 'viem/chains';

import { CosmosChainId } from './graz';
import { SOLANA_MAINNET_ID } from './solana';

export const USDC_ADDRESSES = {
  [mainnet.id]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [optimism.id]: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
  [arbitrum.id]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [polygon.id]: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
  [SOLANA_MAINNET_ID]: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  [CosmosChainId.Noble]: 'uusdc',
  [CosmosChainId.Osmosis]: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4',
  [CosmosChainId.Neutron]: 'ibc/B559A80D62249C8AA07A380E2A2BEA6E5CA9A6F079C912C3A9E9B494105E4F81',
};

export const USDC_DECIMALS = 6;
