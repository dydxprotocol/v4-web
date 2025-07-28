import { useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { useQuery } from '@tanstack/react-query';
import { isArray, isNumber } from 'lodash';

import { useAppSelector } from '@/state/appTypes';

import { sleep } from '@/lib/timeUtils';

export const CURRENT_REWARDS_SEASON_EXPIRATION = '2025-08-01T00:00:00.000Z';
export const CURRENT_REWARDS_SEASON = 4;

export const useBoostedMarketIds = () => {
  const listedMarkets = useAppSelector(BonsaiCore.markets.markets.data);
  const { data: boosted } = useQuery({
    queryKey: ['dydx-surge-boosted-markets'],
    enabled: new Date().getTime() < new Date(CURRENT_REWARDS_SEASON_EXPIRATION).getTime(),
    retry: false,
    refetchOnMount: false,
    queryFn: async () => {
      try {
        // don't take up bandwidth during sensitive loading time
        await sleep(500);
        const data = await fetch(`https://cloud.chaoslabs.co/query/api/dydx/boosted-markets`);
        const result = (await data.json()) as any;
        if (isArray(result) && result.every(isNumber)) {
          return result;
        }
        return null;
      } catch (e) {
        return null;
      }
    },
  });

  return useMemo(() => {
    const boostedClobIds = new Set((boosted ?? []).map((b) => `${b}`));
    return new Set(
      Object.values(listedMarkets ?? {})
        .filter((m) => boostedClobIds.has(m.clobPairId))
        .map((m) => m.ticker)
    );
  }, [boosted, listedMarkets]);
};
