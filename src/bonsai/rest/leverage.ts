import { DEFAULT_LEVERAGE_PPM } from '@/constants/leverage';
import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { setSelectedMarketLeverages } from '@/state/raw';

import { parseToPrimitives } from '@/lib/parseToPrimitives';

import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { selectParentSubaccountAndMarkets } from '../selectors/account';
import { createValidatorQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpUserLeverageParamsQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    name: 'leverageParams',
    selector: selectParentSubaccountAndMarkets,
    getQueryKey: (data) => ['leverageParams', data.parentSubaccount?.address],
    getQueryFn: (compositeClient, data) => {
      return async () => {
        if (!data.parentSubaccount || !data.markets) {
          return {};
        }

        const clobPairToMarket = Object.values(data.markets!).reduce(
          (acc, market) => {
            return {
              ...acc,
              [market.clobPairId]: market.ticker,
            };
          },
          {} as { [clobPairId: number]: string }
        );

        const leverages = await compositeClient.validatorClient.get.getPerpetualMarketsLeverage(
          data.parentSubaccount!.address,
          0
        );
        return leverages.clobPairLeverage.reduce(
          (acc, leverage) => {
            const market = clobPairToMarket[leverage.clobPairId];
            if (market === undefined) {
              return acc;
            }

            return {
              ...acc,
              [market]: DEFAULT_LEVERAGE_PPM / leverage.customImfPpm,
            };
          },
          {} as { [market: string]: number }
        );
      };
    },
    onResult: (result) => {
      store.dispatch(
        setSelectedMarketLeverages(
          mapLoadableData(queryResultToLoadable(result), (d) => parseToPrimitives(d))
        )
      );
    },
    onNoQuery: () => store.dispatch(setSelectedMarketLeverages(loadableIdle())),
    refetchInterval: timeUnits.hour,
    staleTime: timeUnits.hour,
  });
  return () => {
    cleanupEffect();
    store.dispatch(setSelectedMarketLeverages(loadableIdle()));
  };
}
