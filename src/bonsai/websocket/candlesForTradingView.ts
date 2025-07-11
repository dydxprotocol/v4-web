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
        // if we've never seen data before, it's either the existing data or the subscribed message
        // either way, we take it as the basis and only send further updates
        // there is a small race condition where messages could be missed between
        //   when trandingview does the rest query and when we start receiving updates
        if (mostRecentFirstPointStartedAt == null) {
          mostRecentFirstPointStartedAt = data.candles.at(-1)?.startedAt;
          return;
        }
        data.candles.forEach((candle) => {
          if (candle.startedAt >= mostRecentFirstPointStartedAt!) {
            onRealtimeCallback(
              mapCandle({
                ...candle,
                resolution: candle.resolution as unknown as CandleResolution,
                orderbookMidPriceClose: candle.orderbookMidPriceClose ?? undefined,
                orderbookMidPriceOpen: candle.orderbookMidPriceOpen ?? undefined,
              })
            );
          }
        });
        mostRecentFirstPointStartedAt = data.candles.at(-1)?.startedAt;
      }
    );

    // happens on network change or unsubscribe from stream
    return () => {
      unsub();
    };
  });

  subscriptionsByGuid[listenerGuid] = { guid: listenerGuid, unsub: tearDown };
};

export const unsubscribeFromStream = (subscriberUID: string) => {
  subscriptionsByGuid[subscriberUID]?.unsub();
  subscriptionsByGuid[subscriberUID] = undefined;
};
