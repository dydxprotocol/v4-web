import { useQuery } from 'react-query';

import type { DydxAddress } from '@/constants/wallets';

import { log } from '@/lib/telemetry';

export const useQueryChaosLabsIncentives = ({
  dydxAddress,
  season,
}: {
  dydxAddress?: DydxAddress;
  season?: number;
}) => {
  return useQuery({
    enabled: !!dydxAddress,
    queryKey: ['launch_incentives_rewards', dydxAddress, season],
    queryFn: async () => {
      if (!dydxAddress) return undefined;
      const resp = await fetch(
        `https://cloud.chaoslabs.co/query/api/dydx/points/${dydxAddress}?n=${season}`
      );
      return await resp.json();
    },
    onError: (error: Error) => log('LaunchIncentives/fetchPoints', error),
  });
};
