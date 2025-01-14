import { RouteRequest, SkipClient } from '@skip-go/client';
import { useQuery } from '@tanstack/react-query';
import { parseUnits } from 'viem';

import { DYDX_DEPOSIT_CHAIN } from '@/constants/chains';
import { timeUnits } from '@/constants/time';
import { DYDX_CHAIN_USDC_DENOM, TokenForTransfer } from '@/constants/tokens';

import { useSkipClient } from '@/hooks/transfers/skipClient';

async function getSkipWithdrawalRoutes(
  skipClient: SkipClient,
  token: TokenForTransfer,
  amount: string
) {
  const routeOptions: RouteRequest = {
    sourceAssetDenom: DYDX_CHAIN_USDC_DENOM,
    sourceAssetChainID: DYDX_DEPOSIT_CHAIN,
    destAssetDenom: token.denom,
    destAssetChainID: token.chainId,
    amountIn: parseUnits(amount, token.decimals).toString(),
    smartRelay: true,
    smartSwapOptions: { evmSwaps: true },
  };

  const [slow, fast] = await Promise.all([
    skipClient.route(routeOptions),
    skipClient.route({ ...routeOptions, goFast: true }),
  ]);

  // @ts-ignore SDK doesn't know about .goFastTransfer
  const isFastRouteAvailable = Boolean(fast.operations.find((op) => op.goFastTransfer));
  return { slow, fast: isFastRouteAvailable ? fast : undefined };
}

export function useWithdrawalRoutes({
  token,
  amount,
}: {
  token?: TokenForTransfer;
  amount: string;
}) {
  const { skipClient } = useSkipClient();
  const rawAmount = amount && token && parseUnits(amount, token.decimals);

  return useQuery({
    queryKey: ['routes', token?.chainId, token?.denom, amount],
    queryFn: () => getSkipWithdrawalRoutes(skipClient, token!, amount),
    enabled: Boolean(token) && Boolean(rawAmount && rawAmount > 0),
    staleTime: 1 * timeUnits.minute,
    refetchOnMount: 'always',
    placeholderData: (prev) => prev,
    retry: false,
  });
}
