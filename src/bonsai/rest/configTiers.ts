import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { setConfigTiers } from '@/state/raw';

import { parseToPrimitives } from '@/lib/parseToPrimitives';

import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { createValidatorQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpConfigTiersQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    name: 'configTiers',
    selector: () => true,
    getQueryKey: () => ['configTiers'],
    getQueryFn: (compositeClient) => {
      return () =>
        Promise.all([
          compositeClient.validatorClient.get.getEquityTierLimitConfiguration(),
          compositeClient.validatorClient.get.getFeeTiers(),
          compositeClient.validatorClient.get.getAllStakingTiers(),
        ]);
    },
    onResult: (results) => {
      store.dispatch(
        setConfigTiers(
          mapLoadableData(queryResultToLoadable(results), (data) => {
            const equity = parseToPrimitives(data[0]).equityTierLimitConfig;
            const fees = parseToPrimitives(data[1]).params;
            const staking = parseToPrimitives(data[2]).stakingTiers;
            return {
              equityTiers: equity,
              feeTiers: fees,
              stakingTiers: staking,
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
