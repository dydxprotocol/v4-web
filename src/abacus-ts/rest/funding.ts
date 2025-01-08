import { useMemo } from 'react';

import {
  IndexerHistoricalFundingResponse,
  IndexerHistoricalFundingResponseObject,
} from '@/types/indexer/indexerApiGen';
import { useQuery } from '@tanstack/react-query';

import { FundingDirection } from '@/constants/markets';
import { timeUnits } from '@/constants/time';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketIdIfTradeable } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { selectCurrentMarketInfo } from '../selectors/markets';
import { useIndexerClient } from './lib/useIndexer';

const getDirectionFromFundingRate = (fundingRate: string) => {
  const fundingRateBN = MustBigNumber(fundingRate);

  return fundingRateBN.isZero()
    ? FundingDirection.None
    : fundingRateBN.isPositive()
      ? FundingDirection.ToShort
      : FundingDirection.ToLong;
};

const calculateFundingChartObject = (funding: IndexerHistoricalFundingResponseObject) => ({
  fundingRate: funding.rate,
  time: new Date(funding.effectiveAt).getTime(),
  direction: getDirectionFromFundingRate(funding.rate),
});

export const useCurrentMarketHistoricalFunding = () => {
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

      return result.historicalFunding.reverse().map(calculateFundingChartObject);
    },
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });

  const data = useMemo(() => {
    return [
      nextFundingRate && {
        fundingRate: nextFundingRate,
        time: Date.now(),
        direction: getDirectionFromFundingRate(nextFundingRate),
      },
      ...(historicalFundingQuery.data ?? []),
    ].filter(isTruthy);
  }, [historicalFundingQuery.data, nextFundingRate]);

  return {
    ...historicalFundingQuery,
    data,
  };
};
