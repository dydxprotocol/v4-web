import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { DydxChainAsset } from '@/constants/wallets';

import { useSelectedNetwork } from '@/hooks';

export const useTokenConfigs = (): {
  tokensConfigs: {
    ['usdc']: {
      denom: string;
      name: string;
      decimals: number;
    },
    ['chain']: {
      denom: string;
      name: string;
      decimals: number;
    },
  };
  usdcDenom: string;
  usdcLabel: string;
  chainDenom: string;
  chainLabel: string;
} => {
  const { selectedNetwork } = useSelectedNetwork();
  const tokensConfigs = ENVIRONMENT_CONFIG_MAP[selectedNetwork].tokens;

  return { 
    tokensConfigs,
    usdcDenom: tokensConfigs[DydxChainAsset.USDC].denom, 
    usdcLabel: tokensConfigs[DydxChainAsset.USDC].name,
    chainDenom: tokensConfigs[DydxChainAsset.CHAIN].denom,
    chainLabel: tokensConfigs[DydxChainAsset.CHAIN].name,
  };
};
