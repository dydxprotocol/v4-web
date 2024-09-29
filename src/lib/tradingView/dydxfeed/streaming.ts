import type {
  Bar,
  LibrarySymbolInfo,
  ResolutionString,
  SubscribeBarsCallback,
} from 'public/tradingview/charting_library';

import { RESOLUTION_MAP } from '@/constants/candles';

import abacusStateManager from '@/lib/abacus';

import { subscriptionsByChannelId } from './cache';

export const subscribeOnStream = ({
  symbolInfo,
  resolution,
  onRealtimeCallback,
  listenerGuid,
  lastBar,
  noSubscribe,
}: {
  symbolInfo: LibrarySymbolInfo;
  resolution: ResolutionString;
  onRealtimeCallback: SubscribeBarsCallback;
  listenerGuid: string;
  onResetCacheNeededCallback: Function;
  lastBar: Bar;
  noSubscribe?: boolean;
}) => {
  if (!symbolInfo.ticker) return;

  const channelId = `${symbolInfo.ticker}/${RESOLUTION_MAP[resolution]}`;

  const handler = {
    id: listenerGuid,
    callback: onRealtimeCallback,
  };

  let subscriptionItem = subscriptionsByChannelId.get(channelId);

  if (subscriptionItem) {
    // already subscribed to the channel, use the existing subscription
    subscriptionItem.handlers[listenerGuid] = handler;
    return;
  }

  subscriptionItem = {
    subscribeUID: listenerGuid,
    resolution,
    lastBar,
    handlers: {
      [listenerGuid]: handler,
    },
  };

  subscriptionsByChannelId.set(channelId, subscriptionItem);

  if (noSubscribe) return;
  abacusStateManager.handleCandlesSubscription({ channelId, subscribe: true });
};

export const unsubscribeFromStream = (subscriberUID: string, noSubscribe?: boolean) => {
  // find a subscription with id === subscriberUID
  // eslint-disable-next-line no-restricted-syntax
  for (const channelId of subscriptionsByChannelId.keys()) {
    const subscriptionItem = subscriptionsByChannelId.get(channelId);
    const { handlers } = subscriptionItem ?? {};

    if (subscriptionItem && handlers?.[subscriberUID]) {
      // remove from handlers
      delete subscriptionItem.handlers[subscriberUID];

      if (Object.keys(subscriptionItem.handlers).length === 0) {
        // unsubscribe from the channel, if it was the last handler
        if (!noSubscribe) {
          abacusStateManager.handleCandlesSubscription({ channelId, subscribe: false });
        }
        subscriptionsByChannelId.delete(channelId);
        break;
      }
    }
  }
};
