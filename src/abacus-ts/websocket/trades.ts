import { useEffect, useState } from 'react';

import { isWsTradesResponse, isWsTradesUpdateResponses } from '@/types/indexer/indexerChecks';
import { orderBy } from 'lodash';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketIdIfTradeable } from '@/state/perpetualsSelectors';

import { mergeById } from '@/lib/mergeById';

import { Loadable, loadableIdle, loadableLoaded, loadablePending } from '../lib/loadable';
import { TradesData } from '../rawTypes';
import { selectWebsocketUrl } from '../socketSelectors';
import { makeWsValueManager, subscribeToWsValue } from './lib/indexerValueManagerHelpers';
import { IndexerWebsocket } from './lib/indexerWebsocket';
import { WebsocketDerivedValue } from './lib/websocketDerivedValue';

const POST_LIMIT = 250;

function tradesWebsocketValueCreator(
  websocket: IndexerWebsocket,
  { marketId }: { marketId: string }
) {
  return new WebsocketDerivedValue<Loadable<TradesData>>(
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
          // eslint-disable-next-line no-console
          console.log('MarketsTracker found unexpectedly null base data in update');
          return value;
        }
        const allNewTrades = updates.flatMap((u) => u.trades).toReversed();
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
  const [trades, setTrades] = useState<Loadable<TradesData>>(loadableIdle());

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
