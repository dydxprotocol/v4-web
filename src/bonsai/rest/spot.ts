import { QueryObserver } from '@tanstack/react-query';

import { timeUnits } from '@/constants/time';
import { SOL_MINT_ADDRESS } from '@/constants/tokens';

import { type RootStore } from '@/state/_store';
import { appQueryClient } from '@/state/appQueryClient';
import { getCurrentPath, getSpotApiEndpoint } from '@/state/appSelectors';
import { setSolPrice, setTokenMetadata } from '@/state/raw';
import { getCurrentSpotToken } from '@/state/spot';

import { SpotApiClient } from '@/clients/spotApi';

import { createStoreEffect } from '../lib/createStoreEffect';
import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { logBonsaiError, wrapAndLogBonsaiError } from '../logs';
import { queryResultToLoadable } from './lib/queryResultToLoadable';
import { safeSubscribeObserver } from './lib/safeSubscribe';

export function setUpTokenMetadataQuery(store: RootStore) {
  return createStoreEffect(
    store,
    (state) => {
      const currentSpotToken = getCurrentSpotToken(state);
      const spotApiEndpoint = getSpotApiEndpoint(state);

      // Only poll when there's an active spot token
      if (!currentSpotToken) {
        return null;
      }

      return { endpoint: spotApiEndpoint, mint: currentSpotToken };
    },
    (params) => {
      if (!params) {
        store.dispatch(setTokenMetadata(loadableIdle()));
        return () => {};
      }

      const { endpoint, mint } = params;
      const spotApiClient = new SpotApiClient(endpoint);

      const observer = new QueryObserver(appQueryClient, {
        queryKey: ['spot', 'tokenMetadata', mint],
        queryFn: wrapAndLogBonsaiError(() => spotApiClient.getTokenMetadata(mint), 'tokenMetadata'),
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
    }
  );
}

export function setUpSolPriceQuery(store: RootStore) {
  return createStoreEffect(
    store,
    (state) => {
      const currentPath = getCurrentPath(state);
      const spotApiEndpoint = getSpotApiEndpoint(state);

      // Only poll when user is on the spot page
      if (!currentPath.startsWith('/spot')) {
        return null;
      }

      return spotApiEndpoint;
    },
    (endpoint) => {
      if (!endpoint) {
        store.dispatch(setSolPrice(loadableIdle()));
        return () => {};
      }

      const spotApiClient = new SpotApiClient(endpoint);

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
          store.dispatch(
            setSolPrice(mapLoadableData(queryResultToLoadable(result), (data) => data.price))
          );
        } catch (e) {
          logBonsaiError('setUpSolPriceQuery', 'Error handling result from react query', e, result);
        }
      });

      return () => {
        store.dispatch(setSolPrice(loadableIdle()));
        unsubscribe();
      };
    }
  );
}
