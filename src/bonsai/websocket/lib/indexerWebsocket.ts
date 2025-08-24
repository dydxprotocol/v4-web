/* eslint-disable max-classes-per-file */
import {
  BONSAI_DETAILED_LOGS,
  logBonsaiError,
  logBonsaiInfo
} from '@/bonsai/logs';
import typia from 'typia';

import { timeUnits } from '@/constants/time';

import { isTruthy } from '@/lib/isTruthy';

import { MissingMessageDetector } from './missingMessageDetector';
import { ReconnectingWebSocket } from './reconnectingWebsocket';

const NO_ID_SPECIAL_STRING_ID = '______EMPTY_ID______';
const CHANNEL_RETRY_COOLDOWN_MS = timeUnits.minute;

interface SubscriptionHandlerInput {
  channel: string;
  id: string | undefined;
  batched: boolean;
  handleBaseData: (data: any, fullMessage: any) => void;
  handleUpdates: (updates: any[], fullMessage: any) => void;
}

type SubscriptionHandlerTrackingMetadata = {
  receivedBaseData: boolean;
  sentSubMessage: boolean;
  // using subs for this data means we lose it when the user fully unsubscribes and thus might actually retry more often than expected
  // but this is fine since every consumer has subs wrapped in resource managers that prevent lots of churn
  firstSubscriptionTimeMs: number | undefined;
  lastRetryBecauseErrorMs: number | undefined;
  lastRetryBecauseDuplicateMs: number | undefined;
};
type SubscriptionHandler = SubscriptionHandlerInput & SubscriptionHandlerTrackingMetadata;

type SubscriptionMap = {
  [channel: string]: {
    [idOrSpecialString: string]: SubscriptionHandler;
  };
};

class SubscriptionManager {
  private subscriptions: SubscriptionMap = {};

  hasSubscription(channel: string, id?: string): boolean {
    const normalizedId = id ?? NO_ID_SPECIAL_STRING_ID;
    return Boolean(this.subscriptions[channel]?.[normalizedId]);
  }

  getSubscription(channel: string, id?: string): SubscriptionHandler | undefined {
    const normalizedId = id ?? NO_ID_SPECIAL_STRING_ID;
    if (!this.hasSubscription(channel, normalizedId)) {
      return undefined;
    }
    return this.subscriptions[channel]?.[normalizedId];
  }

  addSubscription(handler: SubscriptionHandler): boolean {
    const normalizedId = handler.id ?? NO_ID_SPECIAL_STRING_ID;
    const channel = handler.channel;

    if (this.hasSubscription(channel, normalizedId)) {
      return false;
    }

    this.subscriptions[channel] ??= {};
    this.subscriptions[channel][normalizedId] = handler;
    return true;
  }

  removeSubscription(channel: string, id: string | undefined): boolean {
    const normalizedId = id ?? NO_ID_SPECIAL_STRING_ID;
    if (!this.hasSubscription(channel, normalizedId)) {
      return false;
    }
    delete this.subscriptions[channel]![normalizedId];
    return true;
  }

  getAllSubscriptions(): SubscriptionHandler[] {
    return Object.values(this.subscriptions)
      .flatMap((channelSubs) => Object.values(channelSubs))
      .filter(isTruthy);
  }

  getChannelSubscriptions(channel: string): SubscriptionHandler[] {
    return Object.values(this.subscriptions[channel] ?? {});
  }
}

export class IndexerWebsocket {
  private socket: ReconnectingWebSocket | null = null;
  private subscriptions = new SubscriptionManager();
  private missingMessageDetector: MissingMessageDetector | null = null;
  private indexerWsId: string;
  private sentMessageIds = new Set<number>(); // Track sent message IDs

  constructor(private wsUrl: string) {
    this.indexerWsId = crypto.randomUUID();
    this.socket = new ReconnectingWebSocket({
      url: this.wsUrl,
      handleFreshConnect: this._handleFreshConnect,
      handleMessage: this._handleMessage,
    });
  }

  restart(): void {
    this.socket?.restart();
  }

  teardown(): void {
    this.socket?.teardown();
    this.socket = null;
  }

  /**
   * Inject a fake message into the websocket connection for client-side consumption
   * This simulates receiving a message from the server without actually sending to the server
   * 
   * @param channel - The channel to inject the message into (e.g., 'v4_trades', 'v4_orderbook', 'v4_markets')
   * @param data - The data to inject (generic structure)
   * @param id - The ID for the channel (e.g., marketId for trades)
   * 
   * @example
   * // Inject fake trade data
   * websocket.injectFakeMessage('v4_trades', { trades: [tradeObject] }, marketId);
   * 
   * // Inject fake orderbook data
   * websocket.injectFakeMessage('v4_orderbook', { orderbook: orderbookData }, marketId);
   * 
   * // Inject fake market data
   * websocket.injectFakeMessage('v4_markets', { market: marketData }, marketId);
   * 
   * // Inject custom data to any channel
   * websocket.injectFakeMessage('custom_channel', { customField: 'value' }, 'custom_id');
   */
  injectFakeMessage(channel: string, data: any, id: string): void {
    try {
      const sub = this.subscriptions.getSubscription(channel, id);

      if (!sub || !sub.handleUpdates) {
        logBonsaiError(
          'IndexerWebsocket', 'injectFakeMessage: no subscription found', {
          channel,
          id,
          wsId: this.indexerWsId
        });
        return;
      }

      const updateMessage = { ...data, type: 'fake_injection' as const };

      const fullMessage = {
        type: 'fake_injection',
        message_id: Date.now(), channel, id, contents: updateMessage
      }
      sub.handleUpdates([updateMessage], fullMessage)

    } catch (error) {
      logBonsaiError('IndexerWebsocket', 'Error in injectFakeMessage', {
        error,
        channel,
        data,
        id,
        wsId: this.indexerWsId,
      });
    }
  }

  /**
   * Inject a fake trade message into the websocket connection for client-side consumption
   * This simulates receiving a trade from the server without actually sending to the server
   * @param trade - The trade object to inject
   * @param marketId - The market ID for the trade
   */
  injectFakeTrade(trade: {
    id: string;
    side: 'BUY' | 'SELL';
    size: string;
    price: string;
    type: 'LIMIT' | 'LIQUIDATED' | 'DELEVERAGED';
    createdAt: string;
    market?: string;
  }, marketId: string): void {
    // Use the generic injectFakeMessage method for trades
    this.injectFakeMessage('v4_trades', { trades: [trade] }, marketId);
  }

  /**
   * Inject fake orderbook data into the websocket connection
   * @param orderbookData - The orderbook data to inject
   * @param marketId - The market ID for the orderbook
   */
  injectFakeOrderbook(orderbookData: any, marketId: string): void {
    this.injectFakeMessage('v4_orderbook', { orderbook: orderbookData }, marketId);
  }

  /**
   * Inject fake market data into the websocket connection
   * @param marketData - The market data to inject
   * @param marketId - The market ID
   */
  injectFakeMarketData(marketData: any, marketId: string): void {
    this.injectFakeMessage('v4_markets', { market: marketData }, marketId);
  }

  // returns the unsubscribe function
  addChannelSubscription({
    channel,
    id,
    batched = true,
    handleUpdates,
    handleBaseData,
  }: SubscriptionHandlerInput): () => void {
    this._addSub({ channel, id, batched, handleUpdates, handleBaseData });
    return () => {
      this._performUnsub({ channel, id });
    };
  }

  private _addSub = ({
    channel,
    id,
    batched = true,
    handleUpdates,
    handleBaseData,

    // below here is any metadata we want to allow maintaining between resubscribes
    lastRetryBecauseErrorMs = undefined,
    lastRetryBecauseDuplicateMs = undefined,
    firstSubscriptionTimeMs = undefined,
  }: SubscriptionHandlerInput & Partial<SubscriptionHandlerTrackingMetadata>) => {
    const wasSuccessful = this.subscriptions.addSubscription({
      channel,
      id,
      batched,
      handleBaseData,
      handleUpdates,
      sentSubMessage: false,
      receivedBaseData: false,
      lastRetryBecauseErrorMs,
      lastRetryBecauseDuplicateMs,
      firstSubscriptionTimeMs,
    });

    // fails if already exists
    if (!wasSuccessful) {
      logBonsaiError('IndexerWebsocket', 'this subscription already exists', {
        id: `${channel}/${id}`,
        wsId: this.indexerWsId,
      });
      return;
    }

    if (BONSAI_DETAILED_LOGS) {
      logBonsaiInfo('IndexerWebsocket', 'adding subscription', {
        channel,
        id,
        socketNonNull: this.socket != null,
        socketActive: Boolean(this.socket?.isActive()),
        wsId: this.indexerWsId,
      });
    }

    if (this.socket != null && this.socket.isActive()) {
      const sub = this.subscriptions.getSubscription(channel, id)!;
      sub.sentSubMessage = true;
      if (sub.firstSubscriptionTimeMs == null) {
        sub.firstSubscriptionTimeMs = Date.now();
      }
      this.socket.send({
        batched,
        channel,
        id,
        type: 'subscribe',
      });
    }
  };

  private _performUnsub = (
    { channel, id }: { channel: string; id: string | undefined },
    // if true, don't send the unsub message, just remove from the internal data structure
    shouldSuppressWsMessage: boolean = false
  ) => {
    const sub = this.subscriptions.getSubscription(channel, id);
    const wasSuccessful = this.subscriptions.removeSubscription(channel, id);

    // only if doesn't exist
    if (!wasSuccessful || sub == null) {
      logBonsaiError('IndexerWebsocket', 'unsubbing from nonexistent or already unsubbed channel', {
        channel,
        id,
        wsId: this.indexerWsId,
      });
      return;
    }

    if (shouldSuppressWsMessage) {
      return;
    }

    if (BONSAI_DETAILED_LOGS) {
      logBonsaiInfo('IndexerWebsocket', 'removing subscription', {
        channel,
        id,
        socketNonNull: this.socket != null,
        socketActive: Boolean(this.socket?.isActive()),
        wsId: this.indexerWsId,
      });
    }

    if (this.socket != null && this.socket.isActive() && sub.sentSubMessage) {
      this.socket.send({
        channel,
        id,
        type: 'unsubscribe',
      });
    }
  };

  private _refreshSub = (channel: string, id: string | undefined) => {
    const sub = this.subscriptions.getSubscription(channel, id);
    if (sub == null) {
      return;
    }
    this._performUnsub(sub);
    this._addSub(sub);
  };

  private _maybeRetryTimeoutError = (message: IndexerWebsocketErrorMessage): boolean => {
    if (message.message.startsWith('Internal error, could not fetch data for subscription: ')) {
      const maybeChannel = message.channel;
      const maybeId = message.id;
      if (
        maybeChannel != null &&
        maybeChannel.startsWith('v4_') &&
        this.subscriptions.hasSubscription(maybeChannel, maybeId)
      ) {
        const sub = this.subscriptions.getSubscription(maybeChannel, maybeId)!;
        const lastRefresh = sub.lastRetryBecauseErrorMs ?? 0;
        const hasBaseData = sub.receivedBaseData;
        if (!hasBaseData && Date.now() - lastRefresh > CHANNEL_RETRY_COOLDOWN_MS) {
          sub.lastRetryBecauseErrorMs = Date.now();
          this._refreshSub(maybeChannel, maybeId);
          logBonsaiInfo('IndexerWebsocket', 'error fetching subscription, refetching', {
            maybeChannel,
            maybeId,
            socketNonNull: this.socket != null,
            socketActive: Boolean(this.socket?.isActive()),
            wsId: this.indexerWsId,
          });
          return true;
        }
        logBonsaiError('IndexerWebsocket', 'error fetching subscription, not retrying:', {
          maybeChannel,
          maybeId,
          hasBaseData,
          elapsedSinceLast: Date.now() - lastRefresh,
          wsId: this.indexerWsId,
        });
        return true;
      }
    }
    return false;
  };

  private _maybeFixDuplicateSubError = (message: IndexerWebsocketErrorMessage): boolean => {
    if (message.message.startsWith('Invalid subscribe message: already subscribed (')) {
      // temp until backend adds metadata
      const parsedMatches = message.message.match(/\(([\w_]+)-(.+?)\)/);
      const maybeChannel = parsedMatches?.[1];

      let maybeId = parsedMatches?.[2];
      if (maybeId === maybeChannel) {
        maybeId = undefined;
      }

      if (
        maybeChannel != null &&
        maybeChannel.startsWith('v4_') &&
        this.subscriptions.hasSubscription(maybeChannel, maybeId)
      ) {
        const sub = this.subscriptions.getSubscription(maybeChannel, maybeId)!;
        const lastRefresh = sub.lastRetryBecauseDuplicateMs ?? 0;
        const hasBaseData = sub.receivedBaseData;
        if (!hasBaseData && Date.now() - lastRefresh > CHANNEL_RETRY_COOLDOWN_MS) {
          sub.lastRetryBecauseDuplicateMs = Date.now();
          this._refreshSub(maybeChannel, maybeId);
          logBonsaiInfo('IndexerWebsocket', 'error: subscription already exists, refetching', {
            maybeChannel,
            maybeId,
            socketNonNull: this.socket != null,
            socketActive: Boolean(this.socket?.isActive()),
            wsId: this.indexerWsId,
          });
          return true;
        }
        logBonsaiError('IndexerWebsocket', 'error: subscription already exists, not retrying', {
          maybeChannel,
          maybeId,
          hasBaseData,
          elapsedSinceLast: Date.now() - lastRefresh,
          wsId: this.indexerWsId,
        });
        return true;
      }
    }
    return false;
  };

  // if we get a "could not fetch data" error, we retry once as long as this channel+id is not on cooldown
  // TODO: remove this entirely when backend is more reliable
  private _handleErrorReceived = (message: IndexerWebsocketErrorMessage) => {
    let handled = this._maybeRetryTimeoutError(message);
    // this ensures this isn't called if we already retried and tracks if we have handled it yet
    handled = handled || this._maybeFixDuplicateSubError(message);
    if (handled) {
      return;
    }
    logBonsaiError('IndexerWebsocket', 'encountered server side error:', {
      message,
      wsId: this.indexerWsId,
    });
  };

  private _handleMessage = (messagePre: any) => {
    try {
      // messagePre is already parsed by ReconnectingWebSocket, so we don't need to parse it again
      const message = isWsMessage(messagePre);

      logBonsaiInfo('IndexerWebsocket', 'Raw message received', { messagePre, wsId: this.indexerWsId, });

      // Check if this is a trade message we sent

      if (message.type === 'error') {

        this._handleErrorReceived(message);
        return;
      }

      if (this.missingMessageDetector != null) {
        this.missingMessageDetector.insert(message.message_id);
      } else {
        logBonsaiError('IndexerWebsocket', 'message received before missing message detector initialized');
      }

      if (message.type === 'connected') {
        // Handle connection confirmation
        return;
      }

      if (message.type === 'subscribed') {
        const sub = this.subscriptions.getSubscription(message.channel, message.id);
        if (sub != null) {
          sub.handleBaseData(message.contents, message);
        }
        return;
      }

      if (message.type === 'unsubscribed') {
        // Handle unsubscription confirmation
        return;
      }

      if (message.type === 'channel_data') {
        const sub = this.subscriptions.getSubscription(message.channel, message.id);
        if (sub != null) {
          sub.handleUpdates([message.contents], message);
        }
        return;
      }

      if (message.type === 'channel_batch_data') {
        const sub = this.subscriptions.getSubscription(message.channel, message.id);
        if (sub != null) {
          sub.handleUpdates(message.contents, message);
        }
        return;
      }

    } catch (e) {
      logBonsaiError('IndexerWebsocket', 'Error handling websocket message', {
        messagePre,
        wsId: this.indexerWsId,
        error: e,
      });
    }
  };

  private _handleMissingMessageDetected = () => {
    logBonsaiError('IndexerWebsocket', 'missed message detected, restarting');
    this.missingMessageDetector?.cleanup();
    this.missingMessageDetector = null;
    this.restart();
  };

  // when websocket churns, reconnect all known subscribers
  private _handleFreshConnect = () => {
    this.missingMessageDetector?.cleanup();
    this.missingMessageDetector = new MissingMessageDetector(this._handleMissingMessageDetected);

    if (BONSAI_DETAILED_LOGS) {
      logBonsaiInfo('IndexerWebsocket', 'freshly connected', {
        socketUrl: this.socket?.url,
        wsId: this.indexerWsId,
        socketNonNull: this.socket != null,
        socketActive: Boolean(this.socket?.isActive()),
        subs: this.subscriptions.getAllSubscriptions().map((o) => `${o.channel}///${o.id}`),
      });
    }
    if (this.socket != null && this.socket.isActive()) {
      this.subscriptions.getAllSubscriptions().forEach(({ channel, id }) => {
        const sub = this.subscriptions.getSubscription(channel, id)!;
        this._performUnsub(sub, true);
        this._addSub(sub);
      });
    } else {
      logBonsaiError(
        'IndexerWebsocket',
        "handle fresh connect called when websocket isn't ready.",
        { wsId: this.indexerWsId }
      );
    }
  };
}

type IndexerWebsocketErrorMessage = {
  type: 'error';
  message: string;
  message_id: number;
  channel?: string;
  id?: string;
};
type IndexerWebsocketMessageType =
  | IndexerWebsocketErrorMessage
  | { type: 'connected'; message_id: number }
  | {
    type: 'channel_batch_data';
    message_id: number;
    channel: string;
    id: string | undefined;
    version: string;
    subaccountNumber?: number;
    contents: any[];
  }
  | {
    type: 'channel_data';
    message_id: number;
    channel: string;
    id: string | undefined;
    version: string;
    subaccountNumber?: number;
    contents: any;
  }
  | {
    type: 'subscribed';
    message_id: number;
    channel: string;
    id: string | undefined;
    contents: any;
  }
  | {
    type: 'unsubscribed';
    message_id: number;
    channel: string;
    id: string | undefined;
    contents: any;
  } | {
    type: 'fake_injection';
    message_id: number;
    channel: string;
    id: string | undefined;
    contents: any;
  };

export const isWsMessage = typia.createAssert<IndexerWebsocketMessageType>();
