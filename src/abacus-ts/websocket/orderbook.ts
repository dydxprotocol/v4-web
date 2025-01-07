import { isWsOrderbookResponse, isWsOrderbookUpdateResponses } from '@/types/indexer/indexerChecks';
import { keyBy, mapValues, throttle } from 'lodash';

import { timeUnits } from '@/constants/time';

import { type RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';
import { setOrderbookRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { createStoreEffect } from '../lib/createStoreEffect';
import { Loadable, loadableIdle, loadableLoaded, loadablePending } from '../lib/loadable';
import { OrderbookData } from '../rawTypes';
import { selectWebsocketUrl } from '../socketSelectors';
import { IndexerWebsocket } from './lib/indexerWebsocket';
import { IndexerWebsocketManager } from './lib/indexerWebsocketManager';
import { WebsocketDerivedValue } from './lib/websocketDerivedValue';

function orderbookWebsocketValue(
  websocket: IndexerWebsocket,
  marketId: string,
  onChange: (val: Loadable<OrderbookData>) => void
) {
  return new WebsocketDerivedValue<Loadable<OrderbookData>>(
    websocket,
    {
      channel: 'v4_orderbook',
      id: marketId,
      handleBaseData: (baseMessage) => {
        const message = isWsOrderbookResponse(baseMessage);
        return loadableLoaded({
          asks: mapValues(
            keyBy(message.asks, (a) => a.price),
            (a) => a.size
          ),
          bids: mapValues(
            keyBy(message.bids, (a) => a.price),
            (a) => a.size
          ),
        });
      },
      handleUpdates: (baseUpdates, value) => {
        const updates = isWsOrderbookUpdateResponses(baseUpdates);
        let startingValue = value.data;
        if (startingValue == null) {
          // eslint-disable-next-line no-console
          console.log('MarketsTracker found unexpectedly null base data in update');
          return value;
        }
        startingValue = { asks: { ...startingValue.asks }, bids: { ...startingValue.bids } };
        updates.forEach((update) => {
          if (update.asks) {
            update.asks.forEach(([price, size]) => (startingValue.asks[price] = size));
          }
          if (update.bids) {
            update.bids.forEach(([price, size]) => (startingValue.bids[price] = size));
          }
        });
        return loadableLoaded(startingValue);
      },
    },
    loadablePending(),
    onChange
  );
}

const selectMarketAndWsInfo = createAppSelector(
  [selectWebsocketUrl, (state) => state.perpetuals.currentMarketIdIfTradeable],
  (wsUrl, currentMarketId) => ({ wsUrl, currentMarketId })
);

export function setUpOrderbook(store: RootStore) {
  return createStoreEffect(store, selectMarketAndWsInfo, ({ currentMarketId, wsUrl }) => {
    if (!isTruthy(currentMarketId)) {
      return undefined;
    }
    const throttledSetOrderbook = throttle((data: Loadable<OrderbookData>) => {
      store.dispatch(setOrderbookRaw({ marketId: currentMarketId, data }));
    }, timeUnits.second / 2);

    const thisTracker = orderbookWebsocketValue(
      IndexerWebsocketManager.use(wsUrl),
      currentMarketId,
      (data) => throttledSetOrderbook(data)
    );

    return () => {
      thisTracker.teardown();
      IndexerWebsocketManager.markDone(wsUrl);
      throttledSetOrderbook.cancel();
      store.dispatch(setOrderbookRaw({ marketId: currentMarketId, data: loadableIdle() }));
    };
  });
}
