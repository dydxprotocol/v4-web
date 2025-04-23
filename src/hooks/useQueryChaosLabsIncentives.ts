import { useQuery } from '@tanstack/react-query';

import type { DydxAddress } from '@/constants/wallets';

import { wrapAndLogError } from '@/lib/asyncUtils';
import { calc } from '@/lib/do';

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
    queryFn: wrapAndLogError(
      async () => {
        if (!dydxAddress) return undefined;

        // If season is defined, fetch for a specific season
        if (season !== undefined) {
          const resp = await fetch(
            `https://cloud.chaoslabs.co/query/api/dydx/points/${dydxAddress}?n=${season}`
          );
          return resp.json();
        }

        const currentSeason: number | undefined = await calc(async () => {
          const resp = await fetch(`https://cloud.chaoslabs.co/query/api/dydx/season`);
          return (await resp.json()).currentSeason;
        });

        if (currentSeason == null) {
          return undefined;
        }

        const thisSeasonResponse = await calc(async () => {
          return (
            await fetch(
              `https://cloud.chaoslabs.co/query/api/dydx/points/${dydxAddress}?n=${currentSeason}`
            )
          ).json();
        });

        return {
          dydxRewards: thisSeasonResponse.dydxRewards ?? 0,
          incentivePoints: thisSeasonResponse.incentivePoints ?? 0,
          marketMakingIncentivePoints: thisSeasonResponse.marketMakingIncentivePoints ?? 0,
        };
      },
      'LaunchIncentives/fetchPoints',
      true
    ),
  });
};
