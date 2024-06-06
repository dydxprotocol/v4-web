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
  usdcLabel: string;
  chainTokenDenom: string;
  chainTokenDecimals: number;
  chainTokenLabel: string;
} => {
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const tokensConfigs = TOKEN_CONFIG_MAP[selectedDydxChainId];

  return {
    tokensConfigs,
    usdcDenom: tokensConfigs[DydxChainAsset.USDC].denom,
    usdcDecimals: tokensConfigs[DydxChainAsset.USDC].decimals,
    usdcGasDenom: tokensConfigs[DydxChainAsset.USDC].gasDenom,
    usdcLabel: tokensConfigs[DydxChainAsset.USDC].name,
    chainTokenDenom: tokensConfigs[DydxChainAsset.CHAINTOKEN].denom,
    chainTokenDecimals: tokensConfigs[DydxChainAsset.CHAINTOKEN].decimals,
    chainTokenLabel: tokensConfigs[DydxChainAsset.CHAINTOKEN].name,
  };
};
