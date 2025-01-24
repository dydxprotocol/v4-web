import { timeUnits } from '@/constants/time';
import { IndexerSparklineTimePeriod } from '@/types/indexer/indexerApiGen';
import { isPerpetualMarketSparklineResponse } from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setSparklines } from '@/state/raw';

import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpSparklinesQuery(store: RootStore) {
  const cleanupEffect = createIndexerQueryStoreEffect(store, {
    selector: selectParentSubaccountInfo,
    getQueryKey: () => ['market', 'sparklines'],
    getQueryFn: (indexerClient) => {
      return () =>
        Promise.all([
          indexerClient.markets.getPerpetualMarketSparklines(IndexerSparklineTimePeriod.ONEDAY),
          indexerClient.markets.getPerpetualMarketSparklines(IndexerSparklineTimePeriod.SEVENDAYS),
        ]);
    },
    refetchInterval: timeUnits.minute * 10,
    staleTime: timeUnits.minute * 10,
    onResult: (sparklines) => {
      store.dispatch(
        setSparklines(
          mapLoadableData(queryResultToLoadable(sparklines), (map) => {
            const [oneDay, sevenDays] = map;
            return {
              [IndexerSparklineTimePeriod.ONEDAY]:
                oneDay != null ? isPerpetualMarketSparklineResponse(oneDay) : oneDay,
              [IndexerSparklineTimePeriod.SEVENDAYS]:
                sevenDays != null ? isPerpetualMarketSparklineResponse(sevenDays) : sevenDays,
            };
          })
        )
      );
    },
    onNoQuery: () => store.dispatch(setSparklines(loadableIdle())),
  });

  return () => {
    cleanupEffect();
    store.dispatch(setSparklines(loadableIdle()));
  };
}
