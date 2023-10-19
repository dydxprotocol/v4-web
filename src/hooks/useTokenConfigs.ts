import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { DydxChainAsset } from '@/constants/wallets';

import { useSelectedNetwork } from '@/hooks';

export const useTokenConfigs = (): {
  tokensConfigs: {
    [DydxChainAsset.USDC]: {
      denom: string;
      name: string;
      decimals: number;
    },
    [DydxChainAsset.CHAINTOKEN]: {
      denom: string;
      name: string;
      decimals: number;
    },
  };
  usdcDenom: string;
  usdcLabel: string;
  chainTokenDenom: string;
  chainTokenLabel: string;
} => {
  const { selectedNetwork } = useSelectedNetwork();
  const tokensConfigs = ENVIRONMENT_CONFIG_MAP[selectedNetwork].tokens;

  return { 
    tokensConfigs,
    usdcDenom: tokensConfigs[DydxChainAsset.USDC].denom, 
    usdcLabel: tokensConfigs[DydxChainAsset.USDC].name,
    chainTokenDenom: tokensConfigs[DydxChainAsset.CHAINTOKEN].denom,
    chainTokenLabel: tokensConfigs[DydxChainAsset.CHAINTOKEN].name,
  };
};
