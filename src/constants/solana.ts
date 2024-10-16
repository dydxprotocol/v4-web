import { isMainnet } from './networks';

export const getSolanaChainId = () => {
  return isMainnet ? 'solana' : 'solana-devnet';
};
