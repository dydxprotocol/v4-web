import { QueryObserver } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';
import { SOL_MINT_ADDRESS } from '@/constants/tokens';

import { type RootStore } from '@/state/_store';
import { appQueryClient } from '@/state/appQueryClient';
import { getCurrentPath, getSpotApiEndpoint } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import { setSolPrice, setTokenMetadata } from '@/state/raw';
import { getCurrentSpotToken } from '@/state/spot';

import { SpotApiClient } from '@/clients/spotApi';

import { createStoreEffect } from '../lib/createStoreEffect';
import { loadableIdle } from '../lib/loadable';
import { logBonsaiError, wrapAndLogBonsaiError } from '../logs';
import { queryResultToLoadable } from './lib/queryResultToLoadable';
import { safeSubscribeObserver } from './lib/safeSubscribe';

const getSpotApiEndpointWhenOnSpotPage = createAppSelector(
  [getCurrentPath, getSpotApiEndpoint, getCurrentSpotToken],
  (currentPath, spotApiEndpoint, currentSpotToken) => {
    if (!currentPath.startsWith('/spot') || !currentSpotToken) {
      return null;
    }
    return { endpoint: spotApiEndpoint, currentSpotToken };
  }
);

export function setUpTokenMetadataQuery(store: RootStore) {
  return createStoreEffect(store, getSpotApiEndpointWhenOnSpotPage, (params) => {
    if (!params) {
      store.dispatch(setTokenMetadata(loadableIdle()));
      return () => {};
    }

    const { endpoint, currentSpotToken } = params;
    const spotApiClient = new SpotApiClient(endpoint);

    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['spot', 'tokenMetadata', currentSpotToken],
      queryFn: wrapAndLogBonsaiError(
        () => spotApiClient.getTokenMetadata(currentSpotToken),
        'tokenMetadata'
      ),
      retry: 5,
      retryDelay: (attempt) => timeUnits.second * 3 * 2 ** attempt,
    });

    const unsubscribe = safeSubscribeObserver(observer, (result) => {
      try {
        store.dispatch(setTokenMetadata(queryResultToLoadable(result)));
      } catch (e) {
        logBonsaiError(
          'setUpTokenMetadataQuery',
          'Error handling result from react query',
          e,
          result
        );
      }
    });

    return () => {
      store.dispatch(setTokenMetadata(loadableIdle()));
      unsubscribe();
    };
  });
}

export function setUpSolPriceQuery(store: RootStore) {
  return createStoreEffect(store, getSpotApiEndpointWhenOnSpotPage, (params) => {
    if (!params) {
      store.dispatch(setSolPrice(loadableIdle()));
      return () => {};
    }

    const spotApiClient = new SpotApiClient(params.endpoint);

    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['spot', 'solPrice'],
      queryFn: wrapAndLogBonsaiError(
        () => spotApiClient.getTokenPrice(SOL_MINT_ADDRESS),
        'solPrice'
      ),
      refetchInterval: timeUnits.second * 10,
      staleTime: timeUnits.second * 10,
      retry: 5,
      retryDelay: (attempt) => timeUnits.second * 3 * 2 ** attempt,
    });

    const unsubscribe = safeSubscribeObserver(observer, (result) => {
      try {
        store.dispatch(setSolPrice(queryResultToLoadable(result)));
      } catch (e) {
        logBonsaiError('setUpSolPriceQuery', 'Error handling result from react query', e, result);
      }
    });

    return () => {
      store.dispatch(setSolPrice(loadableIdle()));
      unsubscribe();
    };
  });
}
