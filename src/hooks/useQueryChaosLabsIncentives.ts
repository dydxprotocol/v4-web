import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';

import type { DydxAddress } from '@/constants/wallets';

import { wrapAndLogError } from '@/lib/asyncUtils';
import { calc } from '@/lib/do';

type ChaosLabsIncentivesResponse = {
  incentivePoints: number;
  marketMakingIncentivePoints: number;
  totalFees: number;
};

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
    queryFn: wrapAndLogError(
      async (): Promise<ChaosLabsIncentivesResponse | undefined> => {
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

        const [thisSeasonResponse, thisSeasonFees] = await Promise.all([
          calc(async () => {
            return (
              await fetch(
                `https://cloud.chaoslabs.co/query/api/dydx/points/${dydxAddress}?n=${currentSeason}`
              )
            ).json();
          }),
          calc(async () => {
            return (
              await fetch(
                `https://cloud.chaoslabs.co/query/api/dydx/fees/${dydxAddress}?month=${DateTime.utc().toFormat('yyyy-MM')}`
              )
            ).json();
          }),
        ]);

        return {
          incentivePoints: thisSeasonResponse.incentivePoints ?? 0,
          marketMakingIncentivePoints: thisSeasonResponse.marketMakingIncentivePoints ?? 0,
          totalFees: thisSeasonFees.data?.[0]?.total_fees ?? 0,
        };
      },
      'LaunchIncentives/fetchPoints',
      true
    ),
  });
};
