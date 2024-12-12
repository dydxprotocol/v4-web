import { logAbacusTsError } from '@/abacus-ts/logs';
import { IndexerClient } from '@dydxprotocol/v4-client-js';
import { QueryObserver, QueryObserverOptions, QueryObserverResult } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';

import { type RootState, type RootStore } from '@/state/_store';
import { appQueryClient } from '@/state/appQueryClient';
import { createAppSelector } from '@/state/appTypes';

import { createStoreEffect } from '../../lib/createStoreEffect';
import { selectIndexerUrl, selectWebsocketUrl } from '../../socketSelectors';
import { IndexerClientManager } from './indexerClientManager';

type PassedQueryOptions<R> = Pick<
  QueryObserverOptions<R>,
  | 'staleTime'
  | 'gcTime'
  | 'refetchInterval'
  | 'refetchOnWindowFocus'
  | 'refetchIntervalInBackground'
  | 'refetchOnReconnect'
  | 'refetchOnMount'
>;

type QuerySetupConfig<T, R> = {
  selector: (state: RootState) => T;
  getQueryKey: (selectorResult: NoInfer<T>) => any[];
  getQueryFn: (client: IndexerClient, selectorResult: NoInfer<T>) => (() => Promise<R>) | null;
  onResult: (result: NoInfer<QueryObserverResult<R, Error>>) => void;
  onNoQuery: () => void;
} & PassedQueryOptions<R>;

const baseOptions: PassedQueryOptions<any> = {
  refetchInterval: timeUnits.minute,
  staleTime: timeUnits.second * 30,
};

export function createIndexerQueryStoreEffect<T, R>(
  store: RootStore,
  config: QuerySetupConfig<T, R>
) {
  const fullSelector = createAppSelector(
    [selectWebsocketUrl, selectIndexerUrl, config.selector],
    (wsUrl, indexerUrl, selectorResult) => ({
      infrastructure: { wsUrl, indexerUrl },
      queryData: selectorResult,
    })
  );

  return createStoreEffect(store, fullSelector, (fullResult) => {
    const { infrastructure, queryData } = fullResult;

    const indexerClientConfig = {
      url: infrastructure.indexerUrl,
      wsUrl: infrastructure.wsUrl,
    };
    const indexerClient = IndexerClientManager.use(indexerClientConfig);

    const queryFn = config.getQueryFn(indexerClient, queryData);
    if (!queryFn) {
      IndexerClientManager.markDone(indexerClientConfig);
      config.onNoQuery();
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { selector, getQueryKey, getQueryFn, onResult, ...otherOpts } = config;
    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['indexer', ...config.getQueryKey(queryData), indexerClientConfig],
      queryFn,
      ...baseOptions,
      ...otherOpts,
    });

    const unsubscribe = observer.subscribe((result) => {
      try {
        config.onResult(result);
      } catch (e) {
        logAbacusTsError(
          'IndexerQueryStoreEffect',
          'Error handling result from react query store effect',
          e,
          result
        );
      }
    });

    return () => {
      unsubscribe();
      IndexerClientManager.markDone(indexerClientConfig);
    };
  });
}
