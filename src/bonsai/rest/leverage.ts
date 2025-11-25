import { DEFAULT_LEVERAGE_PPM } from '@/constants/leverage';
import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { setSelectedMarketLeverages } from '@/state/raw';

import { parseToPrimitives } from '@/lib/parseToPrimitives';
import { sleep } from '@/lib/timeUtils';
import { isPresent } from '@/lib/typeUtils';

import { loadableIdle } from '../lib/loadable';
import { mapLoadableData } from '../lib/mapLoadable';
import { createValidatorQueryStoreEffect } from './lib/indexerQueryStoreEffect';
import { queryResultToLoadable } from './lib/queryResultToLoadable';

export function setUpUserLeverageParamsQuery(store: RootStore) {
  const cleanupEffect = createValidatorQueryStoreEffect(store, {
    name: 'leverageParams',
    selector: () => true,
    getQueryKey: () => ['leverageParams'],
    getQueryFn: (compositeClient) => {
      return async () => {
        let state = store.getState();
        let parent = state.raw.account.parentSubaccount.data;
        let allMarkets = state.raw.markets.allMarkets.data;

        // Hacky but necessary for setting initial leverages for open positions
        while (!parent || !allMarkets) {
          // eslint-disable-next-line no-await-in-loop
          await sleep(1000);
          state = store.getState();
          parent = state.raw.account.parentSubaccount.data;
          allMarkets = state.raw.markets.allMarkets.data;
        }

        const childSubaccounts = Object.values(parent.childSubaccounts).filter(isPresent);
        const clobPairToMarket = Object.values(allMarkets).reduce(
          (acc, market) => {
            return {
              ...acc,
              [market.clobPairId]: market.ticker,
            };
          },
          {} as { [clobPairId: number]: string }
        );
        const clobPairToSubaccountNumber = childSubaccounts.reduce(
          (acc, sa) => {
            return {
              ...acc,
              ...Object.values(sa.openPerpetualPositions).reduce(
                (positionAcc, op) => {
                  const market = allMarkets[op.market];
                  if (market === undefined) {
                    return positionAcc;
                  }
                  return {
                    ...positionAcc,
                    [market.clobPairId]: op.subaccountNumber,
                  };
                },
                {} as typeof acc
              ),
            };
          },
          {} as { [clobPairId: number]: number }
        );

        const subaccountLeverages = await Promise.all(
          childSubaccounts.map(async (sa) => {
            return compositeClient.validatorClient.get.getPerpetualMarketsLeverage(
              parent.address,
              sa.subaccountNumber
            );
          })
        );
        return subaccountLeverages.reduce(
          (acc, saLeverage, i) => {
            const subaccountNumber = childSubaccounts[i]!.subaccountNumber;
            return {
              ...acc,
              ...saLeverage.clobPairLeverage.reduce(
                (leverageAcc, l) => {
                  const market = clobPairToMarket[l.clobPairId];
                  if (market === undefined) {
                    return leverageAcc;
                  }

                  const positionSubaccountNumber = clobPairToSubaccountNumber[l.clobPairId];
                  if (
                    positionSubaccountNumber !== undefined &&
                    subaccountNumber !== positionSubaccountNumber
                  ) {
                    return leverageAcc;
                  }
                  return {
                    ...leverageAcc,
                    [market]: DEFAULT_LEVERAGE_PPM / l.customImfPpm,
                  };
                },
                {} as typeof acc
              ),
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
