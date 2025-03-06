import { logBonsaiError } from '@/bonsai/logs';
import {
  selectCompositeClientReady,
  selectIndexerReady,
  selectNobleClientReady,
} from '@/bonsai/socketSelectors';
import { StargateClient } from '@cosmjs/stargate';
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
  | 'retry'
  | 'retryDelay'
  | 'retryOnMount'
  | 'networkMode'
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
    [getSelectedNetwork, selectIndexerReady, config.selector],
    (network, indexerReady, selectorResult) => ({
      infrastructure: { network, indexerReady },
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
    const indexerClient = CompositeClientManager.use(clientConfig).indexer!;

    const unsubscribe = config.handle(
      `${infrastructure.network}-${infrastructure.indexerReady}`,
      indexerClient,
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
        queryFn,
        ...baseOptions,
        ...otherOpts,
      });

      const unsubscribe = observer.subscribe((result) => {
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
    [getSelectedNetwork, selectCompositeClientReady, config.selector],
    (network, compositeClientReady, selectorResult) => ({
      infrastructure: { network, compositeClientReady },
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
    const compositeClient = CompositeClientManager.use(clientConfig).compositeClient!;

    const unsubscribe = config.handle(
      `${infrastructure.network}-${infrastructure.compositeClientReady}`,
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
        queryFn,
        ...baseOptions,
        ...otherOpts,
      });

      const unsubscribe = observer.subscribe((result) => {
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

    const nobleClient = CompositeClientManager.use(clientConfig).nobleClient!;

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
      queryFn,
      ...baseOptions,
      ...otherOpts,
    });

    const unsubscribe = observer.subscribe((result) => {
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
