import { io } from 'socket.io-client';

import type {
  Bar,
  LibrarySymbolInfo,
  QuotesCallback,
  ResolutionString,
} from 'public/tradingview/charting_library';

import { parseFullSymbol } from './helper';

const socket = io('wss://streamer.cryptocompare.com');
const channelToSubscription = new Map();

socket.on('disconnect', (reason: string) => {
  // eslint-disable-next-line no-console
  console.error('[socket] Disconnected:', reason);
});

socket.on('error', (error: Error) => {
  // eslint-disable-next-line no-console
  console.error('[socket] Error:', error);
});

socket.on('m', (data: string) => {
  const [eventTypeStr, exchange, fromSymbol, toSymbol, , , tradeTimeStr, , tradePriceStr] =
    data.split('~');

  if (parseInt(eventTypeStr ?? '0', 10) !== 0) {
    // skip all non-TRADE events
    return;
  }

  const tradePrice = parseFloat(tradePriceStr ?? '0');
  const tradeTime = parseInt(tradeTimeStr ?? '0', 10);
  const channelString = `0~${exchange}~${fromSymbol}~${toSymbol}`;
  const subscriptionItem = channelToSubscription.get(channelString);

  if (!subscriptionItem) {
    return;
  }
  const lastDailyBar = subscriptionItem.lastDailyBar;
  const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);

  let bar: Bar;

  if (tradeTime >= nextDailyBarTime) {
    bar = {
      time: nextDailyBarTime,
      open: tradePrice,
      high: tradePrice,
      low: tradePrice,
      close: tradePrice,
    };
  } else {
    bar = {
      ...lastDailyBar,
      high: Math.max(lastDailyBar.high, tradePrice),
      low: Math.min(lastDailyBar.low, tradePrice),
      close: tradePrice,
    };
  }

  subscriptionItem.lastDailyBar = bar;

  // send data to every subscriber of that symbol
  subscriptionItem.handlers.forEach((handler: any) => handler.callback(bar));
});

function getNextDailyBarTime(barTime: number) {
  const date = new Date(barTime * 1000);
  date.setDate(date.getDate() + 1);
  return date.getTime() / 1000;
}

export function subscribeOnStream(
  symbolInfo: LibrarySymbolInfo,
  resolution: ResolutionString,
  onRealtimeCallback: QuotesCallback,
  subscribeUID: string,
  onResetCacheNeededCallback: () => void,
  lastDailyBar: Bar
) {
  const parsedSymbol = parseFullSymbol(symbolInfo.name);
  if (!parsedSymbol) return;
  const channelString = `0~${parsedSymbol.exchange}~${parsedSymbol.fromSymbol}~${parsedSymbol.toSymbol}`;

  const handler = {
    id: subscribeUID,
    callback: onRealtimeCallback,
  };

  let subscriptionItem = channelToSubscription.get(channelString);

  if (subscriptionItem) {
    // already subscribed to the channel, use the existing subscription
    subscriptionItem.handlers.push(handler);
    return;
  }

  subscriptionItem = {
    subscribeUID,
    resolution,
    lastDailyBar,
    handlers: [handler],
  };

  channelToSubscription.set(channelString, subscriptionItem);
  socket.emit('SubAdd', { subs: [channelString] });
}

export function unsubscribeFromStream(subscriberUID: string) {
  // find a subscription with id === subscriberUID
  // eslint-disable-next-line no-restricted-syntax
  for (const channelString of channelToSubscription.keys()) {
    const subscriptionItem = channelToSubscription.get(channelString);
    const handlerIndex = subscriptionItem.handlers.findIndex(
      (handler: any) => handler.id === subscriberUID
    );

    if (handlerIndex !== -1) {
      // remove from handlers
      subscriptionItem.handlers.splice(handlerIndex, 1);

      if (subscriptionItem.handlers.length === 0) {
        // unsubscribe from the channel, if it was the last handler
        socket.emit('SubRemove', { subs: [channelString] });
        channelToSubscription.delete(channelString);
        break;
      }
    }
  }
}
