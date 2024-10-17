import type { AbacusWebsocketProtocol } from '@/constants/abacus';
import { lastSuccessfulWebsocketRequestByOrigin } from '@/constants/analytics';
import type { Candle, TradingViewChartBar } from '@/constants/candles';
import { isDev } from '@/constants/networks';

import { testFlags } from '@/lib/testFlags';
import { subscriptionsByChannelId } from '@/lib/tradingView/dydxfeed/cache';
import { mapCandle } from '@/lib/tradingView/utils';

import { log } from '../telemetry';

const RECONNECT_INTERVAL_MS = 10_000;

class AbacusWebsocket implements Omit<AbacusWebsocketProtocol, '__doNotUseOrImplementIt'> {
  private socket: WebSocket | null = null;

  private url: string | null = null;

  private connectedCallback: ((p0: boolean) => void) | null = null;

  private receivedCallback: ((p0: string) => void) | null = null;

  private disconnectTimer?: NodeJS.Timeout;

  private reconnectTimer?: NodeJS.Timeout;

  private currentCandleId: string | undefined;

  private isConnecting: boolean = false;

  orderbookCandlesToggleOn: boolean = false;

  connect(url: string, connected: (p0: boolean) => void, received: (p0: string) => void): void {
    this.url = url;
    this.connectedCallback = connected;
    this.receivedCallback = received;
    this._initializeSocket();
  }

  disconnect(): void {
    this._clearSocket();
  }

  send(message: string): void {
    try {
      this.socket?.send(message);
    } catch (error) {
      log('AbacusWebsocketProtocol/send', error, { message });
    }
  }

  handleCandlesSubscription = ({
    channelId,
    subscribe,
  }: {
    channelId: string;
    subscribe: boolean;
  }) => {
    if (!this.socket) return;

    if (subscribe) {
      this.socket.send(
        JSON.stringify({
          type: 'subscribe',
          channel: 'v4_candles',
          id: channelId,
          batched: true,
        })
      );

      this.currentCandleId = channelId;
    } else {
      this.socket.send(
        JSON.stringify({
          type: 'unsubscribe',
          channel: 'v4_candles',
          id: channelId,
        })
      );

      if (this.currentCandleId === channelId) {
        this.currentCandleId = undefined;
      }
    }
  };

  private _initializeSocket = (): void => {
    if (!this.url || !this.connectedCallback || !this.receivedCallback) return;
    if ((this.socket != null && this.socket.readyState === WebSocket.OPEN) || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.isConnecting = false;
      if (this.socket?.readyState === WebSocket.OPEN) {
        this._setReconnectInterval();

        if (this.currentCandleId) {
          this.handleCandlesSubscription({ channelId: this.currentCandleId, subscribe: true });
        }
      } else if (
        this.socket?.readyState === WebSocket.CLOSED ||
        this.socket?.readyState === WebSocket.CLOSING
      ) {
        this.socket = null;
      }
    };

    this.socket.onmessage = (m) => {
      try {
        const parsedMessage = JSON.parse(m.data);

        let shouldProcess = true;

        switch (parsedMessage?.channel) {
          case 'v4_orderbook': {
            shouldProcess = import.meta.env.VITE_ABACUS_PROCESS_ORDERBOOK !== '0';
            break;
          }
          case 'v4_candles': {
            shouldProcess = false;
            const { id, contents } = parsedMessage;

            if (id && contents) {
              const subscriptionItem = subscriptionsByChannelId.get(id);

              if (Array.isArray(contents)) {
                // Contents is an array when receiving websocket updates for candles. It is generally one entry long,
                // with the exception of the start of a new start of a candle resolution: then it is 2 entries long.
                // - the first entry updates the last candle's close, and
                // - the second entry reflects the new candle
                contents.forEach((updatedCandle: Candle) => {
                  if (updatedCandle && subscriptionItem) {
                    const bar: TradingViewChartBar = mapCandle(this.orderbookCandlesToggleOn)(
                      updatedCandle
                    );
                    subscriptionItem.lastBar = bar;

                    // send data to every subscriber of that symbol
                    Object.values(subscriptionItem.handlers).forEach((handler: any) =>
                      handler.callback(bar)
                    );
                  }
                });
              }
            }
            break;
          }
          case 'v4_markets': {
            if (testFlags.displayInitializingMarkets) {
              shouldProcess = false;
              const { contents } = parsedMessage;

              Object.keys(contents.markets ?? {}).forEach((market) => {
                const status = contents.markets[market].status;
                if (status === 'INITIALIZING') {
                  contents.markets[market].status = 'ONLINE';
                }
              });

              this.receivedCallback?.(JSON.stringify(parsedMessage));
            }

            break;
          }
          default: {
            break;
          }
        }

        if (shouldProcess && this.receivedCallback) {
          this.receivedCallback(m.data);
        }

        lastSuccessfulWebsocketRequestByOrigin[new URL(this.url!).origin] = Date.now();
      } catch (error) {
        log('AbacusWebsocketProtocol/onmessage', error);
      }
    };

    this.socket.onclose = (e) => {
      this.isConnecting = false;
      this.connectedCallback?.(false);
      if (!isDev) return;
      // eslint-disable-next-line no-console
      console.warn('AbacusStateManager > WS > close > ', e);
    };

    this.socket.onerror = (e) => {
      this.isConnecting = false;
      this.connectedCallback?.(false);
      if (!isDev) return;
      // eslint-disable-next-line no-console
      console.error('AbacusStateManager > WS > error > ', e);
    };
  };

  private _clearSocket = (): void => {
    if (!this.url || !this.connectedCallback || !this.receivedCallback) return;
    this.socket?.close();
    this.socket = null;

    clearInterval(this.disconnectTimer);
    delete this.disconnectTimer;

    this.connectedCallback(false);
  };

  private _setReconnectInterval = () => {
    if (this.reconnectTimer !== null) clearInterval(this.reconnectTimer);

    this.reconnectTimer = setInterval(() => {
      if (
        !this.socket ||
        this.socket.readyState === WebSocket.CLOSED ||
        this.socket.readyState === WebSocket.CLOSING
      ) {
        this._clearSocket();
        this._initializeSocket();
      }
    }, RECONNECT_INTERVAL_MS);
  };
}

export default AbacusWebsocket;
