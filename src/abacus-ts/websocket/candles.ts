import { orderBy } from 'lodash';

import { isWsCandlesResponse, isWsCandlesUpdateResponse } from '@/types/indexer/indexerChecks';
import { IndexerWsCandleResponse } from '@/types/indexer/indexerManual';

import { Loadable, loadableLoaded, loadablePending } from '../lib/loadable';
import { logAbacusTsError } from '../logs';
import { makeWsValueManager } from './lib/indexerValueManagerHelpers';
import { IndexerWebsocket } from './lib/indexerWebsocket';
import { WebsocketDerivedValue } from './lib/websocketDerivedValue';

function candlesWebsocketValueCreator(
  websocket: IndexerWebsocket,
  { marketId }: { marketId: string }
) {
  return new WebsocketDerivedValue<Loadable<IndexerWsCandleResponse>>(
    websocket,
    {
      channel: 'v4_candles',
      id: marketId,
      handleBaseData: (baseMessage) => {
        const message = isWsCandlesResponse(baseMessage);
        return loadableLoaded({
          // subscribed message is in descending order
          candles: message.candles.toReversed(),
        });
      },
      handleUpdates: (baseUpdates, value) => {
        const updates = isWsCandlesUpdateResponse(baseUpdates);
        const startingValue = value.data;
        if (startingValue == null) {
          logAbacusTsError('CandlesTracker', 'found unexpectedly null base data in update');
          return value;
        }
        if (startingValue.candles.length === 0) {
          return loadableLoaded({ candles: updates });
        }

        const allNewTimes = new Set(updates.map(({ startedAt }) => startedAt));
        const newArr = [
          ...updates,
          ...startingValue.candles.filter(({ startedAt }) => !allNewTimes.has(startedAt)),
        ];
        const sorted = orderBy(newArr, [(a) => a.startedAt], ['desc']);
        return loadableLoaded({ candles: sorted });
      },
    },
    loadablePending()
  );
}

export const CandlesValuesManager = makeWsValueManager(candlesWebsocketValueCreator);
