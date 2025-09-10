import { RouteRequest } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { parseUnits } from 'viem';

import { DYDX_DEPOSIT_CHAIN } from '@/constants/chains';
import { timeUnits } from '@/constants/time';
import { DYDX_CHAIN_DYDX_DENOM, DYDX_CHAIN_USDC_DENOM, USDC_DECIMALS } from '@/constants/tokens';

import { SkipClient, useSkipClient } from '../transfers/skipClient';

export const DYDX_TOKEN = {
  denom: DYDX_CHAIN_DYDX_DENOM,
  chainId: DYDX_DEPOSIT_CHAIN,
  decimals: 18,
};
const DYDX_USDC_TOKEN = {
  denom: DYDX_CHAIN_USDC_DENOM,
  chainId: DYDX_DEPOSIT_CHAIN,
  decimals: USDC_DECIMALS,
};

// Swaps are from dydxchain DYDX <-> dydxchain USDC
async function getSkipSwapRoute(
  skipClient: SkipClient,
  input: 'usdc' | 'dydx',
  amount: string,
  mode: 'exact-in' | 'exact-out'
) {
  const [inputToken, outputToken] =
    input === 'usdc' ? [DYDX_USDC_TOKEN, DYDX_TOKEN] : [DYDX_TOKEN, DYDX_USDC_TOKEN];
  const routeOptions: RouteRequest = {
    sourceAssetDenom: inputToken.denom,
    sourceAssetChainId: inputToken.chainId,
    destAssetDenom: outputToken.denom,
    destAssetChainId: outputToken.chainId,
    swapVenues: [{ chainId: 'dydx-mainnet-1' }, { chainId: 'neutron-1' }],
    smartRelay: true,
    ...(mode === 'exact-in'
      ? { amountIn: parseUnits(amount, inputToken.decimals).toString() }
      : { amountOut: parseUnits(amount, outputToken.decimals).toString() }),
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
  return useQuery({
    queryKey: ['swap-quote', input, amount, mode],
    queryFn: () => getSkipSwapRoute(skipClient, input, amount, mode),
    enabled: Boolean(amount),
    staleTime: 15 * timeUnits.second,
    // Don't auto-retry because some errors are legitimate
    retry: 0,
  });
}
