import { TOKEN_CONFIG_MAP } from '@/constants/networks';
import { DydxChainAsset } from '@/constants/wallets';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

export const useTokenConfigs = (): {
  tokensConfigs: {
    [DydxChainAsset.USDC]: {
      denom: string;
      name: string;
      decimals: number;
      gasDenom?: string;
    };
    [DydxChainAsset.CHAINTOKEN]: {
      denom: string;
      name: string;
      decimals: number;
      gasDenom?: string;
    };
  };
  usdcDenom: string;
  usdcDecimals: number;
  usdcGasDenom: string;
  usdcImage: string;
  usdcLabel: string;
  chainTokenDenom: string;
  chainTokenDecimals: number;
  chainTokenImage: string;
  chainTokenLabel: string;
} => {
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const tokensConfigs = TOKEN_CONFIG_MAP[selectedDydxChainId];

  return {
    tokensConfigs,
    usdcDenom: tokensConfigs[DydxChainAsset.USDC].denom,
    usdcDecimals: tokensConfigs[DydxChainAsset.USDC].decimals,
    usdcGasDenom: tokensConfigs[DydxChainAsset.USDC].gasDenom,
    usdcImage: tokensConfigs[DydxChainAsset.USDC].image,
    usdcLabel: tokensConfigs[DydxChainAsset.USDC].name,
    chainTokenDenom: tokensConfigs[DydxChainAsset.CHAINTOKEN].denom,
    chainTokenDecimals: tokensConfigs[DydxChainAsset.CHAINTOKEN].decimals,
    chainTokenImage: tokensConfigs[DydxChainAsset.CHAINTOKEN].image,
    chainTokenLabel: tokensConfigs[DydxChainAsset.CHAINTOKEN].name,
  };
};
