import { StargateClient } from '@cosmjs/stargate';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';

import { MustBigNumber } from '@/lib/numbers';

import { useAccounts } from './useAccounts';
import { useEndpointsConfig } from './useEndpointsConfig';
import { useTokenConfigs } from './useTokenConfigs';

export const useNobleBalance = () => {
  const { nobleAddress } = useAccounts();
  const { nobleValidator } = useEndpointsConfig();
  const { usdcGasDenom, usdcDecimals } = useTokenConfigs();

  const { data } = useQuery({
    enabled: nobleAddress !== undefined,
    queryKey: ['accountBalances_noble_usdc'],
    queryFn: async () => {
      const client = await StargateClient.connect(nobleValidator);
      const balance = await client.getBalance(nobleAddress!, usdcGasDenom);
      await client.disconnect();
      return formatUnits(BigInt(balance.amount), usdcDecimals);
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: 10_000,
    staleTime: 10_000,
  });

  const usdcBalance = MustBigNumber(data).toNumber();

  return {
    usdcBalance,
  };
};
