import { useEffect, useState } from 'react';

import { orderBy } from 'lodash';

import { isWsTradesResponse, isWsTradesUpdateResponses } from '@/types/indexer/indexerChecks';
import { IndexerWsTradesUpdateObject } from '@/types/indexer/indexerManual';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketIdIfTradeable } from '@/state/currentMarketSelectors';

import { mergeById } from '@/lib/mergeById';

import { Loadable, loadableIdle, loadableLoaded, loadablePending } from '../lib/loadable';
import { logBonsaiError } from '../logs';
import { selectWebsocketUrl } from '../socketSelectors';
import { makeWsValueManager, subscribeToWsValue } from './lib/indexerValueManagerHelpers';
import { IndexerWebsocket } from './lib/indexerWebsocket';
import { WebsocketDerivedValue } from './lib/websocketDerivedValue';

const POST_LIMIT = 250;

function tradesWebsocketValueCreator(
  websocket: IndexerWebsocket,
  { marketId }: { marketId: string }
) {
  return new WebsocketDerivedValue<Loadable<IndexerWsTradesUpdateObject>>(
    websocket,
    {
      channel: 'v4_trades',
      id: marketId,
      handleBaseData: (baseMessage) => {
        const message = isWsTradesResponse(baseMessage);
        return loadableLoaded({
          trades: message.trades.slice(0, POST_LIMIT),
        });
      },
      handleUpdates: (baseUpdates, value) => {
        const updates = isWsTradesUpdateResponses(baseUpdates);
        const startingValue = value.data;
        if (startingValue == null) {
          logBonsaiError('TradesTracker', 'found unexpectedly null base data in update', {
            marketId,
          });
          return value;
        }
        const allNewTrades = updates.flatMap((u) => u.trades).reverse();
        const merged = mergeById(allNewTrades, startingValue.trades, (t) => t.id);
        const sortedMerged = orderBy(merged, [(t) => t.createdAt], ['desc']);
        return loadableLoaded({ trades: sortedMerged.slice(0, POST_LIMIT) });
      },
    },
    loadablePending()
  );
}

export const TradeValuesManager = makeWsValueManager(tradesWebsocketValueCreator);

export function useCurrentMarketTradesValue() {
  const wsUrl = useAppSelector(selectWebsocketUrl);
  const currentMarketId = useAppSelector(getCurrentMarketIdIfTradeable);

  // useSyncExternalStore is better but the API doesn't fit this use case very well
  const [trades, setTrades] = useState<Loadable<IndexerWsTradesUpdateObject>>(loadableIdle());

  useEffect(() => {
    if (currentMarketId == null) {
      return () => null;
    }

    const unsubListener = subscribeToWsValue(
      TradeValuesManager,
      { wsUrl, marketId: currentMarketId },
      (val) => setTrades(val)
    );

    return () => {
      setTrades(loadableIdle());
      unsubListener();
    };
  }, [currentMarketId, wsUrl]);
  return trades;
}
