import { RouteRequest } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { parseUnits } from 'viem';

import { timeUnits } from '@/constants/time';
import { DYDX_CHAIN_DYDX_DENOM } from '@/constants/tokens';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { SkipClient, useSkipClient } from '../transfers/skipClient';
import { TokenConfigsResult, useTokenConfigs } from '../useTokenConfigs';

export const DYDX_TOKEN = {
  denom: DYDX_CHAIN_DYDX_DENOM,
  decimals: 18,
};

const SWAP_VENUES = [
  { chainId: 'osmosis-1', name: 'osmosis-poolmanager' },
  { chainId: 'neutron-1', name: 'neutron-duality' },
  { chainId: 'neutron-1', name: 'neutron-astroport' },
];

// Swaps are from dydxchain DYDX <-> dydxchain USDC
async function getSkipSwapRoute(
  skipClient: SkipClient,
  input: 'usdc' | 'dydx',
  tokenConfig: TokenConfigsResult,
  chainId: string,
  amount: string,
  mode: 'exact-in' | 'exact-out'
) {
  const [inputTokenDenom, outputTokenDenom] =
    input === 'usdc'
      ? [tokenConfig.usdcDenom, tokenConfig.chainTokenDenom]
      : [tokenConfig.chainTokenDenom, tokenConfig.usdcDenom];
  const [inputTokenDecimals, outputTokenDecimals] =
    input === 'usdc'
      ? [tokenConfig.usdcDecimals, tokenConfig.chainTokenDecimals]
      : [tokenConfig.chainTokenDecimals, tokenConfig.usdcDecimals];
  const routeOptions: RouteRequest = {
    sourceAssetDenom: inputTokenDenom,
    sourceAssetChainId: chainId,
    destAssetDenom: outputTokenDenom,
    destAssetChainId: chainId,
    smartRelay: true,
    swapVenues: SWAP_VENUES,
    ...(mode === 'exact-in'
      ? { amountIn: parseUnits(amount, inputTokenDecimals).toString() }
      : { amountOut: parseUnits(amount, outputTokenDecimals).toString() }),
  };

  const route = await skipClient.route(routeOptions);
  if (!route) {
    throw new Error('no route found');
  }

  return route;
}

export function useSwapQuote(
  input: 'usdc' | 'dydx',
  amount: string,
  mode: 'exact-in' | 'exact-out'
) {
  const { skipClient } = useSkipClient();
  const tokenConfig = useTokenConfigs();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  return useQuery({
    queryKey: ['swap-quote', input, amount, mode, selectedDydxChainId],
    queryFn: () =>
      getSkipSwapRoute(skipClient, input, tokenConfig, selectedDydxChainId, amount, mode),
    enabled: Boolean(amount),
    staleTime: 15 * timeUnits.second,
    // Don't auto-retry because some errors are legitimate
    retry: 0,
  });
}
