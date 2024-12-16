import { logAbacusTsError } from '@/abacus-ts/logs';
import { selectCompositeClientReady, selectIndexerReady } from '@/abacus-ts/socketSelectors';
import { CompositeClient, IndexerClient } from '@dydxprotocol/v4-client-js';
import { QueryObserver, QueryObserverOptions, QueryObserverResult } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';

import { type RootState, type RootStore } from '@/state/_store';
import { appQueryClient } from '@/state/appQueryClient';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';

import { createStoreEffect } from '../../lib/createStoreEffect';
import { CompositeClientManager } from './compositeClientManager';

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

type QuerySetupConfig<ClientType, T, R> = {
  selector: (state: RootState) => T;
  getQueryKey: (selectorResult: NoInfer<T>) => any[];
  getQueryFn: (client: ClientType, selectorResult: NoInfer<T>) => (() => Promise<R>) | null;
  onResult: (result: NoInfer<QueryObserverResult<R, Error>>) => void;
  onNoQuery: () => void;
} & PassedQueryOptions<R>;

const baseOptions: PassedQueryOptions<any> = {
  refetchInterval: timeUnits.minute,
  staleTime: timeUnits.second * 30,
};

export function createIndexerQueryStoreEffect<T, R>(
  store: RootStore,
  config: QuerySetupConfig<IndexerClient, T, R>
) {
  const fullSelector = createAppSelector(
    [getSelectedNetwork, selectIndexerReady, config.selector],
    (network, indexerReady, selectorResult) => ({
      infrastructure: { network, indexerReady },
      queryData: selectorResult,
    })
  );

  return createStoreEffect(store, fullSelector, (fullResult) => {
    const { infrastructure, queryData } = fullResult;

    if (!infrastructure.indexerReady) {
      config.onNoQuery();
      return undefined;
    }

    const clientConfig = {
      network: infrastructure.network,
      store,
    };
    const indexerClient = CompositeClientManager.use(clientConfig).indexer!;

    const queryFn = config.getQueryFn(indexerClient, queryData);
    if (!queryFn) {
      CompositeClientManager.markDone(clientConfig);
      config.onNoQuery();
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { selector, getQueryKey, getQueryFn, onResult, ...otherOpts } = config;
    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['indexer', ...config.getQueryKey(queryData), clientConfig.network],
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
      CompositeClientManager.markDone(clientConfig);
    };
  });
}

export function createValidatorQueryStoreEffect<T, R>(
  store: RootStore,
  config: QuerySetupConfig<CompositeClient, T, R>
) {
  const fullSelector = createAppSelector(
    [getSelectedNetwork, selectCompositeClientReady, config.selector],
    (network, compositeClientReady, selectorResult) => ({
      infrastructure: { network, compositeClientReady },
      queryData: selectorResult,
    })
  );

  return createStoreEffect(store, fullSelector, (fullResult) => {
    const { infrastructure, queryData } = fullResult;

    if (!infrastructure.compositeClientReady) {
      config.onNoQuery();
      return undefined;
    }
    const clientConfig = {
      network: infrastructure.network,
      store,
    };
    const compositeClient = CompositeClientManager.use(clientConfig).compositeClient!;

    const queryFn = config.getQueryFn(compositeClient, queryData);
    if (!queryFn) {
      CompositeClientManager.markDone(clientConfig);
      config.onNoQuery();
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { selector, getQueryKey, getQueryFn, onResult, ...otherOpts } = config;
    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['validator', ...config.getQueryKey(queryData), clientConfig.network],
      queryFn,
      ...baseOptions,
      ...otherOpts,
    });

    const unsubscribe = observer.subscribe((result) => {
      try {
        config.onResult(result);
      } catch (e) {
        logAbacusTsError(
          'ValidatorQueryStoreEffect',
          'Error handling result from react query store effect',
          e,
          result
        );
      }
    });

    return () => {
      unsubscribe();
      CompositeClientManager.markDone(clientConfig);
    };
  });
}
