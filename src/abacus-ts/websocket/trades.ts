import { useEffect, useState } from 'react';

import { isWsTradesResponse, isWsTradesUpdateResponses } from '@/types/indexer/indexerChecks';
import { orderBy } from 'lodash';

import { DydxNetwork } from '@/constants/networks';

import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { mergeById } from '@/lib/mergeById';

import { Loadable, loadableIdle, loadableLoaded, loadablePending } from '../lib/loadable';
import { ResourceCacheManager } from '../lib/resourceCacheManager';
import { TradesData } from '../rawTypes';
import { getWebsocketUrlForNetwork } from '../socketSelectors';
import { IndexerWebsocket } from './lib/indexerWebsocket';
import { IndexerWebsocketManager } from './lib/indexerWebsocketManager';
import { WebsocketDerivedValue } from './lib/websocketDerivedValue';

const POST_LIMIT = 250;

function tradesWebsocketValue(
  websocket: IndexerWebsocket,
  marketId: string,
  onChange?: (val: Loadable<TradesData>) => void
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
    loadablePending(),
    onChange
  );
}

export const TradeValuesManager = new ResourceCacheManager({
  constructor: ({ marketId, network }: { network: DydxNetwork; marketId: string }) =>
    tradesWebsocketValue(IndexerWebsocketManager.use(getWebsocketUrlForNetwork(network)), marketId),
  destroyer: (instance) => {
    instance.teardown();
  },
  keySerializer: ({ network, marketId }) => `${network}//////${marketId}`,
});

export function useCurrentMarketTradesValue() {
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const currentMarketId = useAppSelector(getCurrentMarketId);
  // useSyncExternalStore is better but the API doesn't fit this use case very well
  const [trades, setTrades] = useState<Loadable<TradesData>>(loadableIdle());

  useEffect(() => {
    if (currentMarketId == null) {
      return () => null;
    }
    const tradesManager = TradeValuesManager.use({
      marketId: currentMarketId,
      network: selectedNetwork,
    });
    const unsubListener = tradesManager.subscribe((val) => setTrades(val));

    return () => {
      setTrades(loadableIdle());
      unsubListener();
      TradeValuesManager.markDone({ marketId: currentMarketId, network: selectedNetwork });
    };
  }, [selectedNetwork, currentMarketId]);
  return trades;
}
