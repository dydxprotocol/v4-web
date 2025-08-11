import type { ResolutionString, SubscribeBarsCallback } from 'public/tradingview/charting_library';
import { io, Socket } from 'socket.io-client';

import { log, logInfo } from '@/lib/telemetry';

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
      log('SpotStreamingManager', new Error('Spot candle service API URL not configured'));
    }
  }

  private async connect(): Promise<void> {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    if (!this.apiUrl) {
      log('SpotStreamingManager/connect', new Error('Spot candle service API URL not configured'));
      return;
    }

    this.isConnecting = true;
    logInfo('SpotStreamingManager/connect', { apiUrl: this.apiUrl });

    try {
      this.socket = io(this.apiUrl, {
        autoConnect: true,
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        logInfo('SpotStreamingManager/connected');
        this.isConnecting = false;
        this.resubscribeAll();
      });

      this.socket.on('disconnect', (reason) => {
        logInfo('SpotStreamingManager/disconnected', { reason });
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        log(
          'SpotStreamingManager/connect_error',
          error instanceof Error ? error : new Error(String(error))
        );
        this.isConnecting = false;
      });

      this.socket.on('candle', (update: WsSpotCandleUpdate) => {
        this.handleCandleUpdate(update);
      });
    } catch (error) {
      log(
        'SpotStreamingManager/connect_failed',
        error instanceof Error ? error : new Error('Connection failed')
      );
      this.isConnecting = false;
    }
  }

  private resubscribeAll(): void {
    logInfo('SpotStreamingManager/resubscribe_all', {
      subscriptionCount: this.subscriptions.size,
    });

    Array.from(this.subscriptions.values()).forEach((subscription) => {
      this.sendSubscription(subscription.token, subscription.interval);
    });
  }

  private sendSubscription(token: string, interval: SpotCandleServiceInterval): void {
    if (!this.socket || !this.socket.connected) {
      log('SpotStreamingManager/send_subscription_failed', new Error('Socket not ready'));
      return;
    }

    const subscriptionData = { token, interval };

    logInfo('SpotStreamingManager/subscribe', subscriptionData);
    this.socket.emit('subscribe', subscriptionData);
  }

  private sendUnsubscription(token: string, interval: SpotCandleServiceInterval): void {
    if (!this.socket || !this.socket.connected) {
      log('SpotStreamingManager/send_unsubscription_failed', new Error('Socket not ready'));
      return;
    }

    const unsubscriptionData = { token, interval };

    logInfo('SpotStreamingManager/unsubscribe', unsubscriptionData);
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

      logInfo('SpotStreamingManager/candle_update', {
        token,
        interval,
        time: bar.time,
        close: bar.close,
        handlerCount: subscription.handlers.length,
      });

      subscription.handlers.forEach((handler) => {
        try {
          handler.callback(bar);
        } catch (error) {
          log(
            'SpotStreamingManager/handler_error',
            error instanceof Error ? error : new Error('Handler failed')
          );
        }
      });
    } catch (error) {
      log(
        'SpotStreamingManager/handle_update_error',
        error instanceof Error ? error : new Error('Handle update failed')
      );
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

    logInfo('SpotStreamingManager/subscribe_request', {
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
      logInfo('SpotStreamingManager/handler_added', { channelKey });
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
    logInfo('SpotStreamingManager/unsubscribe_request', { subscriberUID });

    const subscriptionEntries = Array.from(this.subscriptions.entries());

    subscriptionEntries.find(([channelKey, subscription]) => {
      const handlerIndex = subscription.handlers.findIndex((h) => h.id === subscriberUID);

      if (handlerIndex !== -1) {
        subscription.handlers.splice(handlerIndex, 1);
        logInfo('SpotStreamingManager/handler_removed', { channelKey, subscriberUID });

        if (subscription.handlers.length === 0) {
          logInfo('SpotStreamingManager/channel_unsubscribe', { channelKey });
          this.sendUnsubscription(subscription.token, subscription.interval);
          this.subscriptions.delete(channelKey);
        }
        return true;
      }
      return false;
    });
  }

  disconnect(): void {
    logInfo('SpotStreamingManager/disconnect');

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
