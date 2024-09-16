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

        // Fetch all seasons 1-6 and sum the points
        const responses = await Promise.all(
          [1, 2, 3, 4, 5, 6].map(async (szn) => {
            const resp = await fetch(
              `https://cloud.chaoslabs.co/query/api/dydx/points/${dydxAddress}?n=${szn}`
            );
            return resp.json();
          })
        );

        // Sum up the points from all seasons
        const summedData = responses.reduce(
          (acc, curr) => {
            return {
              dydxRewards: acc.dydxRewards + (curr.dydxRewards || 0),
              incentivePoints: acc.incentivePoints + (curr.incentivePoints || 0),
              marketMakingIncentivePoints:
                acc.marketMakingIncentivePoints + (curr.marketMakingIncentivePoints || 0),
            };
          },
          {
            dydxRewards: 0,
            incentivePoints: 0,
            marketMakingIncentivePoints: 0,
          }
        );

        return summedData;
      },
      'LaunchIncentives/fetchPoints',
      true
    ),
  });
};
