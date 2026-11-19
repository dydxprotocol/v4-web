import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';

import { timeUnits } from '@/constants/time';
import { USDC_DECIMALS } from '@/constants/tokens';

import { useAccounts } from '@/hooks/useAccounts';
import { useEndpointsConfig } from '@/hooks/useEndpointsConfig';

import { getInjectiveBalances } from '@/lib/injectiveTx';

export const MIN_INJECTIVE_USDC_TO_DEPOSIT = BigInt(1_000_000);

const REFETCH_INTERVAL = 30 * timeUnits.second;

export function useInjectiveBalances() {
  const { injectiveAddress } = useAccounts();
  const { injectiveValidator } = useEndpointsConfig();

  const query = useQuery({
    queryKey: ['injectiveBalances', injectiveAddress, injectiveValidator],
    enabled: Boolean(injectiveAddress && injectiveValidator),
    queryFn: () => getInjectiveBalances(injectiveValidator, injectiveAddress!),
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: false,
  });

  const usdc = query.data?.usdc;

  return {
    ...query,
    injectiveAddress,
    usdc,
    usdcAmount: usdc != null ? formatUnits(usdc, USDC_DECIMALS) : undefined,
    inj: query.data?.inj,
    hasPendingInjectiveDeposit: usdc != null && usdc >= MIN_INJECTIVE_USDC_TO_DEPOSIT,
  };
}
