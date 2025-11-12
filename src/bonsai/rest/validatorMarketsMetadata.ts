import { timeUnits } from '@/constants/time';

import { RootStore } from '@/state/_store';
import { setMarketsFeeDiscountsRaw } from '@/state/raw';

import { parseToPrimitives } from '@/lib/parseToPrimitives';

import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { createValidatorQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

/**
 * Market fee discounts will eventually be returned by the indexer. This query is temporary until then.
 */
export function setUpMarketsFeeDiscountQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    name: 'marketFeeDiscounts',
    selector: () => true,
    getQueryKey: () => ['marketFeeDiscounts'],
    getQueryFn: (compositeClient) => {
      return () => compositeClient.validatorClient.get.getAllPerpMarketFeeDiscounts();
    },
    onResult: (result) => {
      store.dispatch(
        setMarketsFeeDiscountsRaw(
          mapLoadableData(queryResultToLoadable(result), (d) => parseToPrimitives(d).params)
        )
      );
    },
    onNoQuery: () => store.dispatch(setMarketsFeeDiscountsRaw(loadableIdle())),
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });
  return () => {
    cleanupEffect();
  };
}
