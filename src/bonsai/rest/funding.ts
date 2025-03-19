import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';
import { IndexerHistoricalFundingResponse } from '@/types/indexer/indexerApiGen';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketIdIfTradeable } from '@/state/currentMarketSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import {
  getDirectionFromFundingRate,
  HistoricalFundingObject,
  mapFundingChartObject,
} from '../calculators/funding';
import { Loadable } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectCurrentMarketInfo } from '../selectors/summary';
import { queryResultToLoadable } from './lib/queryResultToLoadable';
import { useIndexerClient } from './lib/useIndexer';

export const useCurrentMarketHistoricalFunding = (): Loadable<HistoricalFundingObject[]> => {
  const { indexerClient, key: indexerKey } = useIndexerClient();
  const currentMarketId = useAppSelector(getCurrentMarketIdIfTradeable);
  const { nextFundingRate } = orEmptyObj(useAppSelector(selectCurrentMarketInfo));

  const historicalFundingQuery = useQuery({
    enabled: Boolean(currentMarketId) && Boolean(indexerClient),
    queryKey: ['historicalFunding', currentMarketId, indexerKey],
    queryFn: async () => {
      if (!currentMarketId) {
        throw new Error('Invalid marketId found');
      } else if (!indexerClient) {
        throw new Error('Indexer client not found');
      }

      const result: IndexerHistoricalFundingResponse =
        await indexerClient.markets.getPerpetualMarketHistoricalFunding(currentMarketId);

      return result.historicalFunding.reverse().map(mapFundingChartObject);
    },
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });

  const data = useMemo(() => {
    return [
      ...(historicalFundingQuery.data ?? []),
      nextFundingRate != null && {
        fundingRate: MustBigNumber(nextFundingRate).toNumber(),
        time: Date.now(),
        direction: getDirectionFromFundingRate(nextFundingRate),
      },
    ].filter(isTruthy);
  }, [historicalFundingQuery.data, nextFundingRate]);

  return mapLoadableData(queryResultToLoadable(historicalFundingQuery), () => data);
};
