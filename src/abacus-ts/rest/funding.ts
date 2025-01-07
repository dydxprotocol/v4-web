import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';
import { setFundingRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';
import { orEmptyObj } from '@/lib/typeUtils';

import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpFundingQuery(store: RootStore) {
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: getCurrentMarketId,
    getQueryKey: (marketId) => ['funding', marketId],
    getQueryFn: (indexerClient, marketId) => {
      if (!isTruthy(marketId)) {
        return null;
      }
      return () => indexerClient.markets.getPerpetualMarketHistoricalFunding(marketId);
    },
    onResult: (funding) => {
      const { historicalFunding } = orEmptyObj(funding.data);

      if (historicalFunding && historicalFunding?.[0]) {
        const marketId = historicalFunding[0].ticker;
        store.dispatch(
          setFundingRaw({
            marketId,
            data: queryResultToLoadable(funding),
          })
        );
      }
    },
    onNoQuery: () => {},
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });

  return () => {
    cleanupEffect();
  };
}
