import { QueryObserver } from '@tanstack/react-query';

import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { appQueryClient } from '@/state/appQueryClient';
import { getSelectedNetwork } from '@/state/appSelectors';
import { createAppSelector } from '@/state/appTypes';
import { setComplianceGeoRaw } from '@/state/raw';

import { createStoreEffect } from '../lib/createStoreEffect';
import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { logBonsaiError, wrapAndLogBonsaiError } from '../logs';
import { queryResultToLoadable } from './lib/queryResultToLoadable';
import { safeSubscribeObserver } from './lib/safeSubscribe';

async function fetchGeo(url: string): Promise<{ data: string | undefined }> {
  const response = await fetch(url);

  if (!response.ok) {
    return { data: undefined };
  }

  const payload = await response.json();

  const country = payload?.geo?.country;

  return { data: typeof country === 'string' ? country : undefined };
}

export function setUpGeoQuery(store: RootStore) {
  const geoEndpoint = createAppSelector(
    [getSelectedNetwork],
    (network) => ENVIRONMENT_CONFIG_MAP[network].endpoints.geo
  );

  return createStoreEffect(store, geoEndpoint, (endpoint) => {
    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['geo', endpoint],
      queryFn: wrapAndLogBonsaiError(() => fetchGeo(endpoint), 'geo'),
      refetchInterval: timeUnits.minute * 10,
      staleTime: timeUnits.minute * 10,
      retry: 5,
      // most failures are rate limiting so we should exponentially backoff
      retryDelay: (attempt) => timeUnits.second * 3 * 2 ** attempt,
    });

    const unsubscribe = safeSubscribeObserver(observer, (result) => {
      try {
        store.dispatch(
          setComplianceGeoRaw(mapLoadableData(queryResultToLoadable(result), (r) => r.data))
        );
      } catch (e) {
        logBonsaiError('Geo', 'Error handling result from react query store effect', e, result);
      }
    });

    return () => {
      store.dispatch(setComplianceGeoRaw(loadableIdle()));
      unsubscribe();
    };
  });
}
