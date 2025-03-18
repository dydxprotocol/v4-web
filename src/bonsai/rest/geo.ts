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
import { logBonsaiError } from '../logs';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

async function fetchGeo(url: string): Promise<{ data: string | undefined }> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return { data: undefined };
    }

    const payload = await response.json();

    const country = payload?.geo?.country;

    return { data: typeof country === 'string' ? country : undefined };
  } catch (error) {
    logBonsaiError('Geo', 'Error fetching geo data:', { error });
    throw error;
  }
}

export function setUpGeoQuery(store: RootStore) {
  const geoEndpoint = createAppSelector(
    [getSelectedNetwork],
    (network) => ENVIRONMENT_CONFIG_MAP[network].endpoints.geo
  );

  return createStoreEffect(store, geoEndpoint, (endpoint) => {
    const observer = new QueryObserver(appQueryClient, {
      queryKey: ['geo', endpoint],
      queryFn: () => fetchGeo(endpoint),
      refetchInterval: timeUnits.minute * 10,
      staleTime: timeUnits.minute * 10,
    });

    const unsubscribe = observer.subscribe((result) => {
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
