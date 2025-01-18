import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { setConfigTiers } from '@/state/raw';

import { parseToPrimitives } from '@/lib/abacus/parseToPrimitives';

import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { createValidatorQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpConfigTiersQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    selector: () => true,
    getQueryKey: () => ['configTiers'],
    getQueryFn: (compositeClient) => {
      return () =>
        Promise.all([
          compositeClient.validatorClient.get.getEquityTierLimitConfiguration(),
          compositeClient.validatorClient.get.getFeeTiers(),
        ]);
    },
    onResult: (results) => {
      store.dispatch(
        setConfigTiers(
          mapLoadableData(queryResultToLoadable(results), (data) => {
            const equity = parseToPrimitives(data[0]).equityTierLimitConfig;
            const fees = parseToPrimitives(data[1]).params;
            return {
              equityTiers: equity,
              feeTiers: fees,
            };
          })
        )
      );
    },
    onNoQuery: () => store.dispatch(setConfigTiers(loadableIdle())),
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setConfigTiers(loadableIdle()));
  };
}
