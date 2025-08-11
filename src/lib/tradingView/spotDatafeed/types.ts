import type { SubscribeBarsCallback } from 'public/tradingview/charting_library';

export type SpotCandleServiceInterval =
  | '1S'
  | '5S'
  | '15S'
  | '30S'
  | '1'
  | '5'
  | '15'
  | '30'
  | '60'
  | '240'
  | '720'
  | '1D'
  | '7D';

export type SpotCandleData = {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  v_usd: number; // volume in USD
};

export type SpotCandleServiceQuery = {
  token: string;
  interval: SpotCandleServiceInterval;
  from: string | number; // ISO 8601 or UNIX milliseconds
  to?: string | number; // ISO 8601 or UNIX milliseconds
};

export type WsSpotCandleUpdate = {
  candle: SpotCandleData;
  interval: SpotCandleServiceInterval;
  timestamp: number;
  token: string;
};

export type SpotStreamingSubscription = {
  token: string;
  interval: SpotCandleServiceInterval;
  handlers: SpotStreamingHandler[];
};

export type SpotStreamingHandler = {
  id: string;
  callback: SubscribeBarsCallback;
};
