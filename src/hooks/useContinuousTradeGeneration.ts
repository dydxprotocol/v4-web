import { useCallback, useEffect, useRef, useState } from 'react';

import { orderBy } from 'lodash';

import { isWsTradesResponse, isWsTradesUpdateResponses } from '../types/indexer/indexerChecks';
import { IndexerWsTradesUpdateObject } from '../types/indexer/indexerManual';

import { useAppSelector } from '../state/appTypes';
import { getCurrentMarketIdIfTradeable } from '../state/currentMarketSelectors';

import { mergeById } from '../lib/mergeById';

import { Loadable, loadableIdle, loadableLoaded, loadablePending } from '../bonsai/lib/loadable';
import { logBonsaiError, logBonsaiInfo } from '../bonsai/logs';
import { selectWebsocketUrl } from '../bonsai/socketSelectors';
import { makeWsValueManager, subscribeToWsValue } from '../bonsai/websocket/lib/indexerValueManagerHelpers';
import { IndexerWebsocket } from '../bonsai/websocket/lib/indexerWebsocket';
import { IndexerWebsocketManager } from '../bonsai/websocket/lib/indexerWebsocketManager';
import { WebsocketDerivedValue } from '../bonsai/websocket/lib/websocketDerivedValue';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { orEmptyObj } from '@/lib/typeUtils';

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
          const isFakeInjection = baseUpdates.some(update =>
            update.type === 'fake_injection' ||
            (update as any).type === 'fake_injection'
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
          updateDetails: updates.map(u => ({
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

/**
 * Hook for continuous trade generation using a reasonable price range
 * @param intervalMs - Interval between trades in milliseconds (default: 1000ms)
 * @param enabled - Whether continuous generation is enabled (default: true for auto-start)
 * @returns Object with control functions and status
 */
export function useContinuousTradeGeneration(
  intervalMs: number = 1000,
  enabled: boolean = true
) {
  const [isRunning, setIsRunning] = useState(false);
  const [tradesGenerated, setTradesGenerated] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const websocket = useTradesWebsocket();
  const currentMarketId = useAppSelector(getCurrentMarketIdIfTradeable);
  const { tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  // Auto-start when websocket and market are available
  useEffect(() => {
    if (enabled && websocket && currentMarketId && !isRunning) {
      startGeneration();
    }
  }, [enabled, websocket, currentMarketId, isRunning]);

  // Generate initial batch of 30 trades
  const generateInitialTrades = useCallback(() => {
    if (!websocket || !currentMarketId || hasInitialized) {
      return;
    }

    for (let i = 0; i < 30; i++) {
      try {
        // Use a reasonable price range for demo purposes
        const basePrice = 100 + Math.random() * 1900; // Random price between $100-$2000

        // Add some small random variation to make it look more realistic
        const priceVariation = (Math.random() - 0.5) * 0.02; // ±1%
        const randomPrice = basePrice * (1 + priceVariation);

        // Generate random size between 0.1 and 5.0
        const randomSize = (Math.random() * 4.9 + 0.1).toFixed(2);

        // Randomly choose BUY or SELL (slightly favor BUY for demo purposes)
        const randomSide = Math.random() > 0.45 ? 'BUY' : 'SELL';

        // Format price according to tick size decimals
        const formattedPrice = randomPrice.toFixed(tickSizeDecimals ?? 2);

        const trade = createSampleTrade(currentMarketId, randomSide, randomSize, formattedPrice);

        // Inject the fake trade
        injectFakeTrade(websocket, trade, currentMarketId);

        setTradesGenerated(prev => prev + 1);

      } catch (error) {
        console.error(`Error generating initial trade ${i + 1}:`, error);
      }
    }

    setHasInitialized(true);
  }, [websocket, currentMarketId, hasInitialized, tickSizeDecimals]);

  const generateTrade = useCallback(() => {
    if (!websocket || !currentMarketId) {
      return;
    }

    try {
      // Use a reasonable price range for demo purposes
      // Most crypto assets trade between $1-$10000, so we'll use $100-$2000 as a reasonable range
      const basePrice = 100 + Math.random() * 1900; // Random price between $100-$2000

      // Add some small random variation to make it look more realistic
      const priceVariation = (Math.random() - 0.5) * 0.02; // ±1%
      const randomPrice = basePrice * (1 + priceVariation);

      // Generate random size between 0.1 and 5.0
      const randomSize = (Math.random() * 4.9 + 0.1).toFixed(2);

      // Randomly choose BUY or SELL (slightly favor BUY for demo purposes)
      const randomSide = Math.random() > 0.45 ? 'BUY' : 'SELL';

      // Format price according to tick size decimals
      const formattedPrice = randomPrice.toFixed(tickSizeDecimals ?? 2);

      const trade = createSampleTrade(currentMarketId, randomSide, randomSize, formattedPrice);

      // Inject the fake trade
      injectFakeTrade(websocket, trade, currentMarketId);

      setTradesGenerated(prev => prev + 1);

    } catch (error) {
      console.error('Error generating trade:', error);
    }
  }, [websocket, currentMarketId, tickSizeDecimals, isRunning]);

  const startGeneration = useCallback(() => {
    if (isRunning) {
      return;
    }

    setIsRunning(true);

    // Generate initial batch of 30 trades first
    generateInitialTrades();

    // Set up interval for subsequent trades (every 1 second)
    intervalRef.current = setInterval(() => {
      generateTrade();
    }, intervalMs);
  }, [isRunning, generateTrade, generateInitialTrades, intervalMs, websocket, currentMarketId]);

  const stopGeneration = useCallback(() => {
    if (!isRunning) {
      return;
    }

    setIsRunning(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning]);

  const resetCounter = useCallback(() => {
    setTradesGenerated(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-stop if disabled
  useEffect(() => {
    if (!enabled && isRunning) {
      stopGeneration();
    }
  }, [enabled, isRunning, stopGeneration]);

  return {
    isRunning,
    tradesGenerated,
    startGeneration,
    stopGeneration,
    resetCounter,
    canGenerate: Boolean(websocket && currentMarketId),
    currentPrice: undefined, // We don't have access to current price
  };
}
