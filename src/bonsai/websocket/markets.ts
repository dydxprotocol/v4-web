import { throttle } from 'lodash';

import { timeUnits } from '@/constants/time';
import {
  isIndexerPerpetualMarketResponse,
  isWsBasePerpetualMarketObject,
  isWsMarketUpdateResponses,
  isWsPerpetualMarketResponse
} from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { setAllMarketsRaw } from '@/state/raw';

import { calc } from '@/lib/do';

import { AppStartupTimer } from '../appStartupTimer';
import { createStoreEffect } from '../lib/createStoreEffect';
import { Loadable, loadableLoaded, loadablePending } from '../lib/loadable';
import { logBonsaiError, wrapAndLogBonsaiError } from '../logs';
import { createIndexerStoreEffect } from '../rest/lib/indexerQueryStoreEffect';
import { selectWebsocketUrl } from '../socketSelectors';
import { MarketsData } from '../types/rawTypes';
import { makeWsValueManager, subscribeToWsValue } from './lib/indexerValueManagerHelpers';
import { IndexerWebsocket } from './lib/indexerWebsocket';
import { WebsocketDerivedValue } from './lib/websocketDerivedValue';
import { transformMarkets } from '../lib/marketUtils';

function marketsWebsocketValueCreator(websocket: IndexerWebsocket) {
  return new WebsocketDerivedValue<Loadable<MarketsData>>(
    websocket,
    {
      channel: 'v4_markets',
      id: undefined,
      handleBaseData: (baseMessage) => {
        const message = isWsPerpetualMarketResponse(baseMessage);
        return loadableLoaded(message.markets);
      },
      handleUpdates: (baseUpdates, value) => {
        const updates = isWsMarketUpdateResponses(baseUpdates);
        let startingValue = value.data;
        if (startingValue == null) {
          logBonsaiError('MarketsTracker', 'found unexpectedly null base data in update');
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
              if (updateObj == null) {
                return;
              }
              if (startingValue[marketId] != null) {
                startingValue[marketId] = {
                  ...startingValue[marketId],
                  ...updateObj,
                };
              } else {
                const fullObj = isWsBasePerpetualMarketObject(updateObj);
                startingValue[marketId] = fullObj;
              }
            });
          }
        });
        return loadableLoaded(startingValue);
      },
    },
    loadablePending()
  );
}

const MarketsValueManager = makeWsValueManager(marketsWebsocketValueCreator);

export function setUpMarkets(store: RootStore) {
  let lastSetHadData: boolean = false;
  const setMarkets = (val: Loadable<MarketsData>) => {
    lastSetHadData = val.data != null;
    store.dispatch(setAllMarketsRaw(val));
  };
  const setMarketsIfEmpty = (val: Loadable<MarketsData>) => {
    if (val.data != null && !lastSetHadData) {
      setMarkets(val);
    }
  };
  const throttledSetMarkets = throttle(setMarkets, 2 * timeUnits.second);

  // we load markets via rest call once because it's waaaay faster than websocket for initial load
  const tearDownLoadOnce = createIndexerStoreEffect(store, {
    handleNoClient: () => null,
    selector: () => null,
    handle: (_clientId, client) => {
      let valid = true;
      calc(async () => {
        AppStartupTimer.timeIfFirst('startMarkets');
        const markets = await wrapAndLogBonsaiError(
          () => client.markets.getPerpetualMarkets(),
          'perpetualMarkets'
        )();
        const allMarkets = isIndexerPerpetualMarketResponse(markets);
        if (!valid) {
          return;
        }
        AppStartupTimer.timeIfFirst('loadedMarkets');

        // Transform the raw market data into the final PerpetualMarketSummary format
        const transformedMarkets = transformMarkets(allMarkets.markets);

        setMarketsIfEmpty(loadableLoaded(transformedMarkets));
        tearDownLoadOnce();
      });
      return () => {
        valid = false;
      };
    },
  });

  return createStoreEffect(store, selectWebsocketUrl, (wsUrl) => {
    const unsub = subscribeToWsValue(MarketsValueManager, { wsUrl }, (val) => {
      const hasData = val.data != null;
      // Only set markets if we haven't already set them via REST call
      // HACK: disable websockets temproarily
      if (hasData && !lastSetHadData) {
        setMarkets(val);
      } else if (hasData && lastSetHadData) {
        // Don't overwrite the transformed data with raw websocket data
        console.log("Websocket received market updates, but keeping transformed data from REST call");
        // Optionally, you could merge specific updates here instead of ignoring them completely
      }
    });

    return () => {
      unsub();
      throttledSetMarkets.cancel();
      store.dispatch(setAllMarketsRaw(loadablePending()));
    };
  });
}
