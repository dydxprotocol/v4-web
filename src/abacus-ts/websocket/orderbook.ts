import { IndexerOrderbookResponseObject } from '@/types/indexer/indexerApiGen';
import { IndexerWsOrderbookUpdateResponse } from '@/types/indexer/indexerManual';
import { keyBy, mapValues } from 'lodash';

import { Loadable, loadableLoaded, loadablePending } from '../loadable';
import { ResourceCacheManager } from '../resourceCacheManager';
import { OrderbookData } from '../types';
import { IndexerWebsocket } from './indexerWebsocket';
import { IndexerWebsocketManager } from './indexerWebsocketManager';
import { WebsocketDerivedValue } from './websocketDerivedValue';

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
        const message = baseMessage as IndexerOrderbookResponseObject;
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
        const updates = baseUpdates as IndexerWsOrderbookUpdateResponse[];
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

// todo simplify api to just take market id
// needs to allow adding/removing callbacks too
export const OrderbooksManager = new ResourceCacheManager({
  constructor: ({ wsUrl, marketId }: { wsUrl: string; marketId: string }) =>
    orderbookWebsocketValue(IndexerWebsocketManager.use(wsUrl), marketId, () => null),
  destroyer: (obj) => obj.teardown(),
  keySerializer: ({ marketId, wsUrl }) => `${wsUrl}//////\\\\\\${marketId}`,
});
