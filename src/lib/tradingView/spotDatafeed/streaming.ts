import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import type { ResolutionString, SubscribeBarsCallback } from 'public/tradingview/charting_library';
import { io, Socket } from 'socket.io-client';

import {
  SpotCandleServiceInterval,
  SpotStreamingHandler,
  SpotStreamingSubscription,
  WsSpotCandleUpdate,
} from './types';
import { resolutionToSpotInterval, transformSpotCandleForChart } from './utils';

class SpotStreamingManager {
  private socket: Socket | null = null;

  private subscriptions = new Map<string, SpotStreamingSubscription>();

  private isConnecting = false;

  constructor(private apiUrl: string) {
    if (!apiUrl) {
      logBonsaiError('SpotStreamingManager', 'API URL not configured');
    }
  }

  private async connect(): Promise<void> {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    if (!this.apiUrl) {
      logBonsaiError('SpotStreamingManager', 'API URL not configured');
      return;
    }

    this.isConnecting = true;
    logBonsaiInfo('SpotStreamingManager', 'connecting', { apiUrl: this.apiUrl });

    try {
      this.socket = io(this.apiUrl, {
        autoConnect: true,
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        logBonsaiInfo('SpotStreamingManager', 'connected');
        this.isConnecting = false;
        this.resubscribeAll();
      });

      this.socket.on('disconnect', (reason) => {
        logBonsaiInfo('SpotStreamingManager', 'disconnected', { reason });
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        logBonsaiError('SpotStreamingManager', 'connection error', { error });
        this.isConnecting = false;
      });

      this.socket.on('candle', (update: WsSpotCandleUpdate) => {
        this.handleCandleUpdate(update);
      });
    } catch (error) {
      logBonsaiError('SpotStreamingManager', 'connection failed', { error });
      this.isConnecting = false;
    }
  }

  private resubscribeAll(): void {
    logBonsaiInfo('SpotStreamingManager', 'resubscribing all channels', {
      subscriptionCount: this.subscriptions.size,
    });

    Array.from(this.subscriptions.values()).forEach((subscription) => {
      this.sendSubscription(subscription.token, subscription.interval);
    });
  }

  private sendSubscription(token: string, interval: SpotCandleServiceInterval): void {
    if (!this.socket || !this.socket.connected) {
      logBonsaiError('SpotStreamingManager', 'socket not ready (subscribe)');
      return;
    }

    const subscriptionData = { token, interval };

    logBonsaiInfo('SpotStreamingManager', 'subscribing', subscriptionData);
    this.socket.emit('subscribe', subscriptionData);
  }

  private sendUnsubscription(token: string, interval: SpotCandleServiceInterval): void {
    if (!this.socket || !this.socket.connected) {
      logBonsaiError('SpotStreamingManager', 'socket not ready (unsubscribe)');
      return;
    }

    const unsubscriptionData = { token, interval };

    logBonsaiInfo('SpotStreamingManager', 'unsubscribing', unsubscriptionData);
    this.socket.emit('unsubscribe', unsubscriptionData);
  }

  private handleCandleUpdate(update: WsSpotCandleUpdate): void {
    try {
      const { token, interval } = update;
      const channelKey = `${token}:${interval}`;

      const subscription = this.subscriptions.get(channelKey);
      if (!subscription) {
        return;
      }

      const bar = transformSpotCandleForChart(update.candle);

      logBonsaiInfo('SpotStreamingManager', 'received candle update', {
        token,
        interval,
        handlerCount: subscription.handlers.length,
        ...bar,
      });

      subscription.handlers.forEach((handler) => {
        try {
          handler.callback(bar);
        } catch (error) {
          logBonsaiError('SpotStreamingManager', 'streaming handler error', {
            error,
          });
        }
      });
    } catch (error) {
      logBonsaiError('SpotStreamingManager', 'failed to handle candle update', {
        error,
      });
    }
  }

  subscribe(
    token: string,
    resolution: ResolutionString,
    onRealtimeCallback: SubscribeBarsCallback,
    subscriberUID: string
  ): void {
    const interval = resolutionToSpotInterval(resolution);
    const channelKey = `${token}:${interval}`;

    logBonsaiInfo('SpotStreamingManager', 'subscription requested', {
      channelKey,
      subscriberUID,
    });

    const handler: SpotStreamingHandler = {
      id: subscriberUID,
      callback: onRealtimeCallback,
    };

    let subscription = this.subscriptions.get(channelKey);
    if (subscription) {
      subscription.handlers.push(handler);
      logBonsaiInfo('SpotStreamingManager', 'added handler', { channelKey, subscriberUID });
      return;
    }

    subscription = {
      token,
      interval,
      handlers: [handler],
    };

    this.subscriptions.set(channelKey, subscription);

    this.sendSubscription(token, interval);

    if (!this.socket) {
      this.connect();
    }
  }

  unsubscribe(subscriberUID: string): void {
    logBonsaiInfo('SpotStreamingManager', 'unsubscribe requested', { subscriberUID });

    const subscriptionEntries = Array.from(this.subscriptions.entries());

    subscriptionEntries.find(([channelKey, subscription]) => {
      const handlerIndex = subscription.handlers.findIndex((h) => h.id === subscriberUID);

      if (handlerIndex !== -1) {
        subscription.handlers.splice(handlerIndex, 1);
        logBonsaiInfo('SpotStreamingManager', 'removed handler', { channelKey, subscriberUID });

        if (subscription.handlers.length === 0) {
          logBonsaiInfo('SpotStreamingManager', 'unsubscribing channel', {
            channelKey,
            subscriberUID,
          });
          this.sendUnsubscription(subscription.token, subscription.interval);
          this.subscriptions.delete(channelKey);
        }
        return true;
      }
      return false;
    });
  }

  disconnect(): void {
    logBonsaiInfo('SpotStreamingManager', 'disconnecting');

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscriptions.clear();
    this.isConnecting = false;
  }

  get url() {
    return this.apiUrl;
  }
}

let streamingManager: SpotStreamingManager | null = null;

const getOrCreateStreamingManager = (apiUrl: string): SpotStreamingManager => {
  if (!streamingManager || streamingManager.url !== apiUrl) {
    if (streamingManager) {
      streamingManager.disconnect();
    }
    streamingManager = new SpotStreamingManager(apiUrl);
  }
  return streamingManager;
};

export const subscribeToSpotStream = (
  apiUrl: string,
  token: string,
  resolution: ResolutionString,
  onRealtimeCallback: SubscribeBarsCallback,
  subscriberUID: string
) => {
  const manager = getOrCreateStreamingManager(apiUrl);
  manager.subscribe(token, resolution, onRealtimeCallback, subscriberUID);
};

export const unsubscribeFromSpotStream = (subscriberUID: string) => {
  if (streamingManager) {
    streamingManager.unsubscribe(subscriberUID);
  }
};

export const disconnectSpotStream = () => {
  if (streamingManager) {
    streamingManager.disconnect();
    streamingManager = null;
  }
};
