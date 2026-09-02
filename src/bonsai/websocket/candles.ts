import { orderBy, sortedIndexBy } from 'lodash';

import { isWsCandlesResponse, isWsCandlesUpdateResponse } from '@/types/indexer/indexerChecks';
import { IndexerWsCandleResponse } from '@/types/indexer/indexerManual';

import { Loadable, loadableLoaded, loadablePending } from '../lib/loadable';
import { logBonsaiError } from '../logs';
import { makeWsValueManager } from './lib/indexerValueManagerHelpers';
import { IndexerWebsocket } from './lib/indexerWebsocket';
import { WebsocketDerivedValue } from './lib/websocketDerivedValue';

export function mergeCandles<T extends { startedAt: string }>(existing: T[], updates: T[]): T[] {
  if (updates.length === 0) {
    return existing;
  }

  const candles = [...existing];
  updates.forEach((update) => {
    const index = sortedIndexBy(candles, update, ({ startedAt }) => startedAt);
    if (candles[index]?.startedAt === update.startedAt) {
      candles[index] = update;
    } else {
      candles.splice(index, 0, update);
    }
  });
  return candles;
}

function candlesWebsocketValueCreator(
  websocket: IndexerWebsocket,
  { marketIdAndResolution }: { marketIdAndResolution: string }
) {
  return new WebsocketDerivedValue<Loadable<IndexerWsCandleResponse>>(
    websocket,
    {
      channel: 'v4_candles',
      id: marketIdAndResolution,
      handleBaseData: (baseMessage) => {
        const message = isWsCandlesResponse(baseMessage);
        return loadableLoaded({
          candles: orderBy(message.candles, [(a) => a.startedAt], ['asc']),
        });
      },
      handleUpdates: (baseUpdates, value) => {
        const updates = isWsCandlesUpdateResponse(baseUpdates);
        const startingValue = value.data;
        if (startingValue == null) {
          logBonsaiError('CandlesTracker', 'found unexpectedly null base data in update');
          return value;
        }
        return loadableLoaded({ candles: mergeCandles(startingValue.candles, updates) });
      },
    },
    loadablePending()
  );
}

export const CandlesValuesManager = makeWsValueManager(candlesWebsocketValueCreator);
