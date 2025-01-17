import { timeUnits } from '@/constants/time';
import { IndexerSparklineTimePeriod } from '@/types/indexer/indexerApiGen';
import { isPerpetualMarketSparklineResponse } from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setSparklines } from '@/state/raw';

import { loadableIdle } from '../lib/loadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { createIndexerQueryStoreEffect } from './lib/indexerQueryStoreEffect';

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
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
    onResult: (sparklines) => {
      store.dispatch(
        setSparklines({
          status: sparklines.status,
          data:
            sparklines.data != null
              ? {
                  [IndexerSparklineTimePeriod.ONEDAY]: isPerpetualMarketSparklineResponse(
                    sparklines.data[0]
                  ),
                  [IndexerSparklineTimePeriod.SEVENDAYS]: isPerpetualMarketSparklineResponse(
                    sparklines.data[1]
                  ),
                }
              : {
                  [IndexerSparklineTimePeriod.ONEDAY]: undefined,
                  [IndexerSparklineTimePeriod.SEVENDAYS]: undefined,
                },
          error: sparklines.error,
        })
      );
    },
    onNoQuery: () => store.dispatch(setSparklines(loadableIdle())),
  });

  return () => {
    cleanupEffect();
    store.dispatch(setSparklines(loadableIdle()));
  };
}
