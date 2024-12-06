import { IndexerPerpetualMarketResponse } from '@/types/indexer/indexerApiGen';
import { IndexerWsMarketUpdateResponse } from '@/types/indexer/indexerManual';
import { throttle } from 'lodash';

import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { setAllMarketsRaw } from '@/state/raw';

import { createStoreEffect } from '../createStoreEffect';
import { Loadable, loadableLoaded, loadablePending } from '../loadable';
import { selectWebsocketUrl } from '../socketSelectors';
import { MarketsData } from '../types';
import { IndexerWebsocket } from './indexerWebsocket';
import { IndexerWebsocketManager } from './indexerWebsocketManager';
import { WebsocketDerivedValue } from './websocketDerivedValue';

function marketsWebsocketValue(
  websocket: IndexerWebsocket,
  onChange: (val: Loadable<MarketsData>) => void
) {
  return new WebsocketDerivedValue<Loadable<MarketsData>>(
    websocket,
    {
      channel: 'v4_markets',
      id: undefined,
      handleBaseData: (baseMessage) => {
        const message = baseMessage as IndexerPerpetualMarketResponse;
        return loadableLoaded(message.markets);
      },
      handleUpdates: (baseUpdates, value) => {
        const updates = baseUpdates as IndexerWsMarketUpdateResponse[];
        let startingValue = value.data;
        if (startingValue == null) {
          // eslint-disable-next-line no-console
          console.log('MarketsTracker found unexpectedly null base data in update');
          return value;
        }
        startingValue = { ...startingValue };
        updates.forEach((update) => {
          if (update.oraclePrices != null) {
            Object.entries(update.oraclePrices).forEach(([marketId, oraclePriceObj]) => {
              if (startingValue[marketId] != null && oraclePriceObj.oraclePrice != null) {
                startingValue[marketId] = {
                  ...startingValue[marketId],
                  oraclePrice: oraclePriceObj.oraclePrice,
                };
              }
            });
          }
          if (update.trading != null) {
            Object.entries(update.trading).forEach(([marketId, updateObj]) => {
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (startingValue[marketId] != null && updateObj != null) {
                startingValue[marketId] = {
                  ...startingValue[marketId],
                  ...updateObj,
                };
              }
            });
          }
        });
        return loadableLoaded(startingValue);
      },
    },
    loadablePending(),
    onChange
  );
}

export function setUpMarkets(store: RootStore) {
  const throttledSetMarkets = throttle((val: Loadable<MarketsData>) => {
    store.dispatch(setAllMarketsRaw(val));
  }, 2 * timeUnits.second);

  return createStoreEffect(store, selectWebsocketUrl, (wsUrl) => {
    const thisTracker = marketsWebsocketValue(IndexerWebsocketManager.use(wsUrl), (val) =>
      throttledSetMarkets(val)
    );

    return () => {
      thisTracker.teardown();
      IndexerWebsocketManager.markDone(wsUrl);
    };
  });
}
