import {
  SpotCandleServiceCandleObject,
  SpotCandleServiceInterval,
} from '@/clients/spotCandleService';

import { BaseSocketIOManager } from './BaseSocketIOManager';

export type SpotCandleServiceWsCandleUpdate = {
  candle: SpotCandleServiceCandleObject;
  interval: SpotCandleServiceInterval;
  timestamp: number;
  token: string;
};

class SpotCandleSocketManager extends BaseSocketIOManager {
  protected setupEventListeners(): void {
    this.socket!.on('candle', (update: SpotCandleServiceWsCandleUpdate) => {
      const channel = `${update.token}:${update.interval}`;
      this.notifyHandlers(channel, update.candle);
    });
  }

  protected sendSubscription(channel: string): void {
    const [token, interval] = channel.split(':');
    this.socket!.emit('subscribe', { token, interval });
  }

  protected sendUnsubscription(channel: string): void {
    const [token, interval] = channel.split(':');
    this.socket!.emit('unsubscribe', { token, interval });
  }
}

let candleManager: SpotCandleSocketManager | null = null;

export const subscribeToSpotCandles = (
  apiUrl: string,
  token: string,
  interval: SpotCandleServiceInterval,
  onCandleUpdate: (candle: SpotCandleServiceCandleObject) => void,
  subscriberUID?: string
): (() => void) => {
  if (!candleManager || candleManager.urlValue !== apiUrl) {
    candleManager?.disconnect();
    candleManager = new SpotCandleSocketManager(apiUrl);
  }

  const channel = `${token}:${interval}`;
  return candleManager.subscribe(channel, onCandleUpdate, subscriberUID);
};

export const unsubscribeFromSpotStream = (subscriberUID: string) => {
  if (candleManager) {
    candleManager.unsubscribe(subscriberUID);
  }
};

export const disconnectSpotStream = () => {
  if (candleManager) {
    candleManager.disconnect();
    candleManager = null;
  }
};
