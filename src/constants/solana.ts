import { isMainnet } from './networks';

export const getSolanaChainId = () => {
  return isMainnet ? SOLANA_MAINNET_ID : 'solana-devnet';
};

export const SOLANA_MAINNET_ID = 'solana';
