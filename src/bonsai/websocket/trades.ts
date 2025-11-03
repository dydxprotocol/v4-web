import { useCallback, useEffect, useRef, useState } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { orderBy } from 'lodash';

import { isWsTradesResponse, isWsTradesUpdateResponses } from '@/types/indexer/indexerChecks';
import { IndexerWsTradesUpdateObject } from '@/types/indexer/indexerManual';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketIdIfTradeable } from '@/state/currentMarketSelectors';

import { mergeById } from '@/lib/mergeById';
import { orEmptyObj } from '@/lib/typeUtils';

import { Loadable, loadableIdle, loadableLoaded, loadablePending } from '../lib/loadable';
import { logBonsaiError, logBonsaiInfo } from '../logs';
import { selectWebsocketUrl } from '../socketSelectors';
import { makeWsValueManager, subscribeToWsValue } from './lib/indexerValueManagerHelpers';
import { IndexerWebsocket } from './lib/indexerWebsocket';
import { IndexerWebsocketManager } from './lib/indexerWebsocketManager';
import { WebsocketDerivedValue } from './lib/websocketDerivedValue';

// Type definitions for fake message injection
export interface FakeTradeData {
  id: string;
  side: 'BUY' | 'SELL';
  size: string;
  price: string;
  type: 'LIMIT' | 'LIQUIDATED' | 'DELEVERAGED';
  createdAt: string;
  market?: string;
}

export interface FakeOrderbookData {
  bids: Array<[string, string]>; // [price, size]
  asks: Array<[string, string]>; // [price, size]
  timestamp: string;
}

export interface FakeMarketData {
  price: string;
  volume24h: string;
  change24h: string;
  high24h: string;
  low24h: string;
}

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
        logBonsaiInfo('TradesTracker', 'Received base trades data', {
          marketId,
          tradesCount: message.trades.length,
          firstTrade: message.trades[0],
          lastTrade: message.trades[message.trades.length - 1],
        });
        return loadableLoaded({
          trades: message.trades.slice(0, POST_LIMIT),
        });
      },
      handleUpdates: (baseUpdates, value) => {
        const updates = isWsTradesUpdateResponses(baseUpdates);
        const startingValue = value.data;

        // Handle case where we're injecting fake trades without base data
        if (startingValue == null) {
          // Check if this is a fake trade injection
          const isFakeInjection = baseUpdates.some(
            (update) =>
              update.type === 'fake_injection' || (update as any).type === 'fake_injection'
          );

          if (isFakeInjection) {
            // Create base data from the injected trades
            const allNewTrades = updates.flatMap((u) => u.trades).reverse();
            const sortedTrades = orderBy(allNewTrades, [(t) => t.createdAt], ['desc']);

            logBonsaiInfo('TradesTracker', 'Created base data from fake trade injection', {
              marketId,
              tradesCount: sortedTrades.length,
            });

            return loadableLoaded({ trades: sortedTrades.slice(0, POST_LIMIT) });
          }

          logBonsaiError('TradesTracker', 'found unexpectedly null base data in update', {
            marketId,
          });
          return value;
        }

        logBonsaiInfo('TradesTracker', 'Received trades update', {
          marketId,
          updatesCount: updates.length,
          updateDetails: updates.map((u) => ({
            tradesCount: u.trades.length,
            firstTrade: u.trades[0],
            lastTrade: u.trades[u.trades.length - 1],
          })),
          currentTradesCount: startingValue.trades.length,
        });

        const allNewTrades = updates.flatMap((u) => u.trades).reverse();
        const merged = mergeById(allNewTrades, startingValue.trades, (t) => t.id);
        const sortedMerged = orderBy(merged, [(t) => t.createdAt], ['desc']);

        logBonsaiInfo('TradesTracker', 'Processed trades update', {
          marketId,
          newTradesCount: allNewTrades.length,
          mergedTradesCount: merged.length,
          finalTradesCount: sortedMerged.slice(0, POST_LIMIT).length,
        });

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

/**
 * Hook that provides access to the websocket instance for sending trades
 * @returns The IndexerWebsocket instance if available
 */
export function useTradesWebsocket(): IndexerWebsocket | null {
  const wsUrl = useAppSelector(selectWebsocketUrl);

  if (!wsUrl) {
    return null;
  }

  // Get the websocket instance from the manager
  return IndexerWebsocketManager.use(wsUrl);
}

/**
 * Hook that provides both trades data and websocket access for the current market
 * @returns Object containing trades data and websocket instance
 */
export function useCurrentMarketTradesWithWebsocket() {
  const trades = useCurrentMarketTradesValue();
  const websocket = useTradesWebsocket();
  const currentMarketId = useAppSelector(getCurrentMarketIdIfTradeable);

  return {
    trades,
    websocket,
    currentMarketId,
    canSendTrades: Boolean(websocket && currentMarketId),
  };
}

/**
 * Inject a fake message into the websocket connection for client-side consumption
 * This simulates receiving a message from the server without actually sending to the server
 * @param websocket - The IndexerWebsocket instance
 * @param channel - The channel to inject the message into (e.g., 'v4_trades')
 * @param data - The data to inject (generic structure)
 * @param id - The ID for the channel (e.g., marketId for trades)
 */
export function injectFakeMessage(
  websocket: IndexerWebsocket,
  channel: string,
  data: any,
  id: string
): void {
  websocket.injectFakeMessage(channel, data, id);
}

/**
 * Inject a fake trade message into the websocket connection for client-side consumption
 * This simulates receiving a trade from the server without actually sending to the server
 * @param websocket - The IndexerWebsocket instance
 * @param trade - The trade object to inject
 * @param marketId - The market ID for the trade
 */
export function injectFakeTrade(
  websocket: IndexerWebsocket,
  trade: FakeTradeData,
  marketId: string
): void {
  // Use the generic injectFakeMessage method for trades
  websocket.injectFakeMessage('v4_trades', { trades: [trade] }, marketId);
}

/**
 * Inject fake orderbook data into the websocket connection
 * @param websocket - The IndexerWebsocket instance
 * @param orderbookData - The orderbook data to inject
 * @param marketId - The market ID for the orderbook
 */
export function injectFakeOrderbook(
  websocket: IndexerWebsocket,
  orderbookData: FakeOrderbookData,
  marketId: string
): void {
  websocket.injectFakeMessage('v4_orderbook', { orderbook: orderbookData }, marketId);
}

/**
 * Inject fake market data into the websocket connection
 * @param websocket - The IndexerWebsocket instance
 * @param marketData - The market data to inject
 * @param marketId - The market ID
 */
export function injectFakeMarketData(
  websocket: IndexerWebsocket,
  marketData: FakeMarketData,
  marketId: string
): void {
  websocket.injectFakeMessage('v4_markets', { market: marketData }, marketId);
}

/**
 * Utility function to create a sample trade object
 * @param marketId - The market ID for the trade
 * @param side - The trade side (BUY or SELL)
 * @param size - The trade size as a string
 * @param price - The trade price as a string
 * @returns A properly formatted trade object with all required fields
 */
export function createSampleTrade(
  marketId: string,
  side: 'BUY' | 'SELL',
  size: string,
  price: string
) {
  return {
    id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    side,
    size,
    price,
    type: 'LIMIT' as const,
    createdAt: new Date().toISOString(),
    createdAtHeight: Math.floor(Math.random() * 1000000).toString(), // Required field
    market: marketId,
  };
}
