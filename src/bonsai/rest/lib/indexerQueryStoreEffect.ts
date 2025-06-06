import { logBonsaiError, wrapAndLogBonsaiError } from '@/bonsai/logs';
import {
  selectCompositeClientKey,
  selectCompositeClientReady,
  selectCompositeClientUrl,
  selectIndexerClientKey,
  selectIndexerReady,
  selectNobleClientReady,
} from '@/bonsai/socketSelectors';
import { type StargateClient } from '@cosmjs/stargate';
import { CompositeClient, IndexerClient } from '@dydxprotocol/v4-client-js';
import { QueryObserver, QueryObserverOptions, QueryObserverResult } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';

import { type RootState, type RootStore } from '@/state/_store';
import { appQueryClient } from '@/state/appQueryClient';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';

import { createStoreEffect } from '../../lib/createStoreEffect';
import { CompositeClientManager } from './compositeClientManager';
import { safeSubscribeObserver } from './safeSubscribe';

type PassedQueryOptions<R> = Pick<
  QueryObserverOptions<R>,
  | 'staleTime'
  | 'gcTime'
  | 'refetchInterval'
  | 'refetchOnWindowFocus'
  | 'refetchIntervalInBackground'
  | 'refetchOnReconnect'
  | 'refetchOnMount'
  | 'retry'
  | 'retryDelay'
  | 'retryOnMount'
  | 'networkMode'
>;

type QuerySetupConfig<ClientType, T, R> = {
  name: string;
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

type InfraSetupConfig<ClientType, T> = {
  selector: (state: RootState) => T;

  // this is called if the client changes in any way or your selector data changes
  // IF YOU RETURN UNDEFINED YOU PROMISE YOU ARE TOTALLY DONE USING THE CLIENT AND IT WILL BE GARBAGE COLLECTED
  handle: (clientId: string, client: ClientType, result: T) => undefined | (() => void);

  // called if client isn't ready or possible to construct
  handleNoClient: undefined | (() => void);
};

export function createIndexerStoreEffect<T>(
  store: RootStore,
  config: InfraSetupConfig<IndexerClient, T>
) {
  const fullSelector = createAppSelector(
    [getSelectedNetwork, selectIndexerReady, selectIndexerClientKey, config.selector],
    (network, indexerReady, clientId, selectorResult) => ({
      infrastructure: { network, indexerReady, clientId },
      selectorResult,
    })
  );

  return createStoreEffect(store, fullSelector, (fullResult) => {
    const { infrastructure, selectorResult } = fullResult;

    if (!infrastructure.indexerReady) {
      config.handleNoClient?.();
      return undefined;
    }

    const clientConfig = {
      network: infrastructure.network,
      dispatch: store.dispatch,
    };
    const indexerClient = CompositeClientManager.use(clientConfig).indexer.client!;

    const unsubscribe = config.handle(infrastructure.clientId, indexerClient, selectorResult);

    if (unsubscribe == null) {
      CompositeClientManager.markDone(clientConfig);
      return undefined;
    }

    return () => {
      unsubscribe();
      CompositeClientManager.markDone(clientConfig);
    };
  });
}

export function createIndexerQueryStoreEffect<T, R>(
  store: RootStore,
  config: QuerySetupConfig<IndexerClient, T, R>
) {
  return createIndexerStoreEffect(store, {
    selector: config.selector,
    handle: (clientId, indexerClient, queryData) => {
      const queryFn = config.getQueryFn(indexerClient, queryData);

      if (!queryFn) {
        config.onNoQuery();
        return undefined;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { selector, getQueryKey, getQueryFn, onResult, ...otherOpts } = config;
      const observer = new QueryObserver(appQueryClient, {
        queryKey: ['indexer', ...config.getQueryKey(queryData), clientId],
        queryFn: wrapAndLogBonsaiError(queryFn, config.name),
        ...baseOptions,
        ...otherOpts,
      });

      const unsubscribe = safeSubscribeObserver(observer, (result) => {
        try {
          config.onResult(result);
        } catch (e) {
          logBonsaiError(
            'IndexerQueryStoreEffect',
            'Error handling result from react query store effect',
            e,
            result
          );
        }
      });

      return () => {
        unsubscribe();
      };
    },
    handleNoClient: () => {
      config.onNoQuery();
    },
  });
}

export function createValidatorStoreEffect<T>(
  store: RootStore,
  config: InfraSetupConfig<CompositeClient, T>
) {
  const fullSelector = createAppSelector(
    [
      getSelectedNetwork,
      selectCompositeClientReady,
      selectCompositeClientUrl,
      selectCompositeClientKey,
      config.selector,
    ],
    (network, compositeClientReady, compositeClientUrl, clientId, selectorResult) => ({
      infrastructure: { network, compositeClientReady, compositeClientUrl, clientId },
      selectorResult,
    })
  );

  return createStoreEffect(store, fullSelector, (fullResult) => {
    const { infrastructure, selectorResult } = fullResult;

    if (!infrastructure.compositeClientReady) {
      config.handleNoClient?.();
      return undefined;
    }
    const clientConfig = {
      network: infrastructure.network,
      dispatch: store.dispatch,
    };
    const compositeClient = CompositeClientManager.use(clientConfig).compositeClient.client!;

    const unsubscribe = config.handle(
      // we want to trigger refreshes when we switch validator url too
      infrastructure.clientId,
      compositeClient,
      selectorResult
    );

    if (unsubscribe == null) {
      CompositeClientManager.markDone(clientConfig);
      return undefined;
    }

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
  return createValidatorStoreEffect(store, {
    selector: config.selector,
    handleNoClient: () => {
      config.onNoQuery();
    },
    handle: (clientId, compositeClient, queryData) => {
      const queryFn = config.getQueryFn(compositeClient, queryData);
      if (!queryFn) {
        config.onNoQuery();
        return undefined;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { selector, getQueryKey, getQueryFn, onResult, ...otherOpts } = config;
      const observer = new QueryObserver(appQueryClient, {
        queryKey: ['validator', ...config.getQueryKey(queryData), clientId],
        queryFn: wrapAndLogBonsaiError(queryFn, config.name),
        ...baseOptions,
        ...otherOpts,
      });

      const unsubscribe = safeSubscribeObserver(observer, (result) => {
        try {
          config.onResult(result);
        } catch (e) {
          logBonsaiError(
            'ValidatorQueryStoreEffect',
            'Error handling result from react query store effect',
            e,
            result
          );
        }
      });

      return () => {
        unsubscribe();
      };
    },
  });
}

export function createNobleQueryStoreEffect<T, R>(
  store: RootStore,
  config: QuerySetupConfig<StargateClient, T, R>
) {
  const fullSelector = createAppSelector(
    [getSelectedNetwork, selectNobleClientReady, config.selector],
    (network, nobleClientReady, selectorResult) => ({
      infrastructure: { network, nobleClientReady },
      queryData: selectorResult,
    })
  );

  return createStoreEffect(store, fullSelector, (fullResult) => {
    const { infrastructure, queryData } = fullResult;

    if (!infrastructure.nobleClientReady) {
      config.onNoQuery();
      return undefined;
    }

    const clientConfig = {
      network: infrastructure.network,
      dispatch: store.dispatch,
    };

    const nobleClient = CompositeClientManager.use(clientConfig).nobleClient.client!;

    const queryFn = config.getQueryFn(nobleClient, queryData);
    if (!queryFn) {
      CompositeClientManager.markDone(clientConfig);
      config.onNoQuery();
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { selector, getQueryKey, getQueryFn, onResult, ...otherOpts } = config;
    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['nobleClient', ...config.getQueryKey(queryData), clientConfig.network],
      queryFn: wrapAndLogBonsaiError(queryFn, config.name),
      ...baseOptions,
      ...otherOpts,
    });

    const unsubscribe = safeSubscribeObserver(observer, (result) => {
      try {
        config.onResult(result);
      } catch (e) {
        logBonsaiError(
          'NobleClientQueryStoreEffect',
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
