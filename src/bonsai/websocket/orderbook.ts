import { keyBy, mapValues, throttle } from 'lodash';

import { timeUnits } from '@/constants/time';
import {
  isWsOrderbookChannelBatchDataMessage,
  isWsOrderbookResponse,
  isWsOrderbookSubscribedMessage,
  isWsOrderbookUpdateResponses,
} from '@/types/indexer/indexerChecks';

import { type RootStore } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';
import { getCurrentMarketIdIfTradeable } from '@/state/currentMarketSelectors';
import { setOrderbookRaw } from '@/state/raw';

import { isTruthy } from '@/lib/isTruthy';

import { createStoreEffect } from '../lib/createStoreEffect';
import { Loadable, loadableIdle, loadableLoaded, loadablePending } from '../lib/loadable';
import { logBonsaiError } from '../logs';
import { selectWebsocketUrl } from '../socketSelectors';
import { OrderbookData } from '../types/rawTypes';
import { makeWsValueManager, subscribeToWsValue } from './lib/indexerValueManagerHelpers';
import { IndexerWebsocket } from './lib/indexerWebsocket';
import { WebsocketDerivedValue } from './lib/websocketDerivedValue';

function orderbookWebsocketValueCreator(
  websocket: IndexerWebsocket,
  { marketId }: { marketId: string }
) {
  return new WebsocketDerivedValue<Loadable<OrderbookData>>(
    websocket,
    {
      channel: 'v4_orderbook',
      id: marketId,
      handleBaseData: (baseMessage, _, fullMessage) => {
        const wsMessage = isWsOrderbookSubscribedMessage(fullMessage);
        const message = isWsOrderbookResponse(baseMessage);
        return loadableLoaded({
          asks: mapValues(
            keyBy(message.asks, (a) => a.price),
            (a) => ({
              size: a.size,
              offset: wsMessage.message_id,
            })
          ),
          bids: mapValues(
            keyBy(message.bids, (a) => a.price),
            (a) => ({ size: a.size, offset: wsMessage.message_id })
          ),
        });
      },
      handleUpdates: (baseUpdates, value, fullMessage) => {
        const wsMessage = isWsOrderbookChannelBatchDataMessage(fullMessage);
        const updates = isWsOrderbookUpdateResponses(baseUpdates);
        let startingValue = value.data;
        if (startingValue == null) {
          logBonsaiError('OrderbookTracker', 'found unexpectedly null base data in update', {
            marketId,
          });
          return value;
        }
        startingValue = { asks: { ...startingValue.asks }, bids: { ...startingValue.bids } };
        updates.forEach((update) => {
          if (update.asks) {
            update.asks.forEach(
              ([price, size]) =>
                (startingValue.asks[price] = { size, offset: wsMessage.message_id })
            );
          }
          if (update.bids) {
            update.bids.forEach(
              ([price, size]) =>
                (startingValue.bids[price] = { size, offset: wsMessage.message_id })
            );
          }
        });
        return loadableLoaded(startingValue);
      },
    },
    loadablePending()
  );
}

const OrderbookValueManager = makeWsValueManager(orderbookWebsocketValueCreator);

const selectMarketAndWsInfo = createAppSelector(
  [selectWebsocketUrl, getCurrentMarketIdIfTradeable],
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

    const unsub = subscribeToWsValue(
      OrderbookValueManager,
      { wsUrl, marketId: currentMarketId },
      (data) => throttledSetOrderbook(data)
    );

    return () => {
      unsub();
      throttledSetOrderbook.cancel();
      store.dispatch(setOrderbookRaw({ marketId: currentMarketId, data: loadableIdle() }));
    };
  });
}
