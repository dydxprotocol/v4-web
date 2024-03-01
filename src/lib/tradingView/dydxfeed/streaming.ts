import type {
  Bar,
  LibrarySymbolInfo,
  QuotesCallback,
  ResolutionString,
} from 'public/tradingview/charting_library';

import { RESOLUTION_MAP } from '@/constants/candles';

import abacusStateManager from '@/lib/abacus';

import { subscriptionsByChannelId } from './cache';

export const subscribeOnStream = ({
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscribeUID,
  onResetCacheNeededCallback,
  lastBar,
}: {
  symbolInfo: LibrarySymbolInfo;
  resolution: ResolutionString;
  onRealtimeCallback: QuotesCallback;
  subscribeUID: string;
  onResetCacheNeededCallback: () => void;
  lastBar: Bar;
}) => {
  if (!symbolInfo.name) return;

  const channelId = `${symbolInfo.name}/${RESOLUTION_MAP[resolution]}`;

  const handler = {
    id: subscribeUID,
    callback: onRealtimeCallback,
  };

  let subscriptionItem = subscriptionsByChannelId.get(channelId);

  if (subscriptionItem) {
    // already subscribed to the channel, use the existing subscription
    subscriptionItem.handlers[subscribeUID] = handler;
    return;
  }

  subscriptionItem = {
    subscribeUID,
    resolution,
    lastBar,
    handlers: {
      [subscribeUID]: handler,
    },
  };

  subscriptionsByChannelId.set(channelId, subscriptionItem);
  abacusStateManager.handleCandlesSubscription({ channelId, subscribe: true });
};

export const unsubscribeFromStream = (subscriberUID: string) => {
  // find a subscription with id === subscriberUID
  for (const channelId of subscriptionsByChannelId.keys()) {
    const subscriptionItem = subscriptionsByChannelId.get(channelId);
    const { handlers } = subscriptionItem || {};

    if (subscriptionItem && handlers?.[subscriberUID]) {
      // remove from handlers
      delete subscriptionItem.handlers[subscriberUID];
      const id = channelId;

      if (Object.keys(subscriptionItem.handlers).length === 0) {
        // unsubscribe from the channel, if it was the last handler
        abacusStateManager.handleCandlesSubscription({ channelId, subscribe: false });
        subscriptionsByChannelId.delete(channelId);
        break;
      }
    }
  }
};
