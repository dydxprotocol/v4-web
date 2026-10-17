import { createStoreEffect } from '@/bonsai/lib/createStoreEffect';
import { selectWebsocketUrl } from '@/bonsai/socketSelectors';
import { CandlesValuesManager } from '@/bonsai/websocket/candles';
import { subscribeToWsValue } from '@/bonsai/websocket/lib/indexerValueManagerHelpers';
import type {
  LibrarySymbolInfo,
  ResolutionString,
  SubscribeBarsCallback,
} from 'public/tradingview/charting_library';

import { CandleResolution, RESOLUTION_MAP } from '@/constants/candles';

import { type RootStore } from '@/state/_store';

import { mapCandle } from '../../lib/tradingView/utils';

export const subscriptionsByGuid: {
  [guid: string]:
    | {
        guid: string;
        unsub: () => void;
      }
    | undefined;
} = {};

export const getCandlesToPublish = <T extends { startedAt: string }>(
  candles: T[],
  mostRecentStartedAt?: string
) =>
  mostRecentStartedAt == null
    ? candles.slice(-1)
    : candles.filter(({ startedAt }) => startedAt >= mostRecentStartedAt);

export const replaceSubscription = (guid: string, unsub?: () => void) => {
  subscriptionsByGuid[guid]?.unsub();
  if (unsub) subscriptionsByGuid[guid] = { guid, unsub };
  else delete subscriptionsByGuid[guid];
};

export const subscribeOnStream = ({
  store,
  symbolInfo,
  resolution,
  onRealtimeCallback,
  listenerGuid,
  onResetCacheNeededCallback,
}: {
  store: RootStore;
  symbolInfo: LibrarySymbolInfo;
  resolution: ResolutionString;
  onRealtimeCallback: SubscribeBarsCallback;
  listenerGuid: string;
  onResetCacheNeededCallback: Function;
}) => {
  replaceSubscription(listenerGuid);
  if (!symbolInfo.ticker) return;

  const channelId = `${symbolInfo.ticker}/${RESOLUTION_MAP[resolution]}`;
  let isFirstRun = true;

  const tearDown = createStoreEffect(store, selectWebsocketUrl, (wsUrl) => {
    // if the websocket url changes, force a refresh
    if (isFirstRun) {
      isFirstRun = false;
    } else {
      setTimeout(() => onResetCacheNeededCallback(), 0);
    }

    let mostRecentFirstPointStartedAt: string | undefined;
    const unsub = subscribeToWsValue(
      CandlesValuesManager,
      { wsUrl, marketIdAndResolution: channelId },
      ({ data }) => {
        if (data == null || data.candles.length === 0) {
          return;
        }
        getCandlesToPublish(data.candles, mostRecentFirstPointStartedAt).forEach((candle) => {
          onRealtimeCallback(
            mapCandle({
              ...candle,
              resolution: candle.resolution as unknown as CandleResolution,
              orderbookMidPriceClose: candle.orderbookMidPriceClose ?? undefined,
              orderbookMidPriceOpen: candle.orderbookMidPriceOpen ?? undefined,
            })
          );
        });
        mostRecentFirstPointStartedAt = data.candles.at(-1)?.startedAt;
      }
    );

    // happens on network change or unsubscribe from stream
    return () => {
      unsub();
    };
  });

  replaceSubscription(listenerGuid, tearDown);
};

export const unsubscribeFromStream = (subscriberUID: string) => {
  replaceSubscription(subscriberUID);
};
