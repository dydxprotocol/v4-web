import { TOKEN_CONFIG_MAP } from '@/constants/networks';
import { DydxChainAsset } from '@/constants/wallets';

import { useSelectedNetwork } from '@/hooks';

export const useTokenConfigs = (): {
  tokensConfigs: {
    [DydxChainAsset.USDC]: {
      denom: string;
      name: string;
      decimals: number;
      gasDenom?: string;
    },
    [DydxChainAsset.CHAINTOKEN]: {
      denom: string;
      name: string;
      decimals: number;
      gasDenom?: string;
    },
  };
  usdcDenom: string;
  usdcDecimals: number;
  usdcLabel: string;
  chainTokenDenom: string;
  chainTokenDecimals: number;
  chainTokenLabel: string;
} => {
  const { selectedDydxChainId } = useSelectedNetwork();
  const tokensConfigs = TOKEN_CONFIG_MAP[selectedDydxChainId];

  return { 
    tokensConfigs,
    usdcDenom: tokensConfigs[DydxChainAsset.USDC].denom, 
    usdcDecimals: tokensConfigs[DydxChainAsset.USDC].decimals, 
    usdcLabel: tokensConfigs[DydxChainAsset.USDC].name,
    chainTokenDenom: tokensConfigs[DydxChainAsset.CHAINTOKEN].denom,
    chainTokenDecimals: tokensConfigs[DydxChainAsset.CHAINTOKEN].decimals, 
    chainTokenLabel: tokensConfigs[DydxChainAsset.CHAINTOKEN].name,
  };
};
