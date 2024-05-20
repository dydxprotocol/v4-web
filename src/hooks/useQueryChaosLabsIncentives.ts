import { useQuery } from '@tanstack/react-query';

import type { DydxAddress } from '@/constants/wallets';

import { wrapAndLogError } from '@/lib/asyncUtils';

type ChaosLabsIncentivesResponse = {
  dydxRewards: number;
  incentivePoints: number;
  marketMakingIncentivePoints: number;
};

export const useQueryChaosLabsIncentives = ({
  dydxAddress,
  season,
}: {
  dydxAddress?: DydxAddress;
  season?: number;
}) => {
  return useQuery<ChaosLabsIncentivesResponse | undefined, Error>({
    enabled: !!dydxAddress,
    queryKey: ['launch_incentives_rewards', dydxAddress, season],
    queryFn: wrapAndLogError(async () => {
      if (!dydxAddress) return undefined;
      const resp = await fetch(
        `https://cloud.chaoslabs.co/query/api/dydx/points/${dydxAddress}?n=${season}`
      );
      return resp.json();
    }, 'LaunchIncentives/fetchPoints'),
  });
};
