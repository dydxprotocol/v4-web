import { SpotApiBarObject, SpotApiBarsResolution } from '@/clients/spotApi';

import { BaseSocketIOManager } from './BaseSocketIOManager';

export interface SpotCandleAggregateData {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  volume: string;
  buyVolume: string;
  sellVolume: string;
  buyers: number;
  sellers: number;
  buys: number;
  sells: number;
  traders: number;
  transactions: number;
  liquidity: string;
  volumeNativeToken: string;
  v: string | null;
}

export interface SpotTokenBarsUpdate {
  tokenMint: string;
  data: {
    aggregates: {
      [key: string]: {
        t: number;
        token: SpotCandleAggregateData;
        usd: SpotCandleAggregateData;
      };
    };
    eventSortKey: string;
    networkId: number;
    statsType: string;
    timestamp: number;
    tokenAddress: string;
    tokenId: string;
  };
}

const getResolutionKey = (resolution: SpotApiBarsResolution): string => {
  return `r${resolution}`;
};

const transformAggregateToBar = (aggregate: SpotCandleAggregateData): SpotApiBarObject => {
  return {
    t: aggregate.t,
    o: aggregate.o,
    h: aggregate.h,
    l: aggregate.l,
    c: aggregate.c,
    volume: aggregate.volume,
  };
};

class SpotCandleSocketManager extends BaseSocketIOManager {
  protected setupEventListeners(): void {
    this.socket!.on('token-bars-update', (update: SpotTokenBarsUpdate) => {
      const { aggregates } = update.data;

      this.subscriptions.forEach((_, channel) => {
        const [tokenMint, resolution] = channel.split(':');

        if (tokenMint === update.tokenMint) {
          const resolutionKey = getResolutionKey(resolution as SpotApiBarsResolution);
          const aggregateData = aggregates[resolutionKey];

          if (aggregateData?.usd) {
            const bar = transformAggregateToBar(aggregateData.usd);
            this.notifyHandlers(channel, bar);
          }
        }
      });
    });
  }

  protected sendSubscription(channel: string): void {
    const [tokenMint] = channel.split(':');
    this.socket!.emit('subscribe-token-bars', { tokenMint });
  }

  protected sendUnsubscription(channel: string): void {
    const [tokenMint] = channel.split(':');
    this.socket!.emit('unsubscribe-token-bars', { tokenMint });
  }
}

let candleManager: SpotCandleSocketManager | null = null;

export const subscribeToSpotCandles = (
  apiUrl: string,
  tokenMint: string,
  resolution: SpotApiBarsResolution,
  onCandleUpdate: (candle: SpotApiBarObject) => void,
  subscriberUID?: string
): (() => void) => {
  if (!candleManager || candleManager.urlValue !== apiUrl) {
    candleManager?.disconnect();
    candleManager = new SpotCandleSocketManager(apiUrl);
  }

  const channel = `${tokenMint}:${resolution}`;
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
