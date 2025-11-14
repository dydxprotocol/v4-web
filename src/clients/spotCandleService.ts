import { logBonsaiError } from '@/bonsai/logs';

import { simpleFetch } from '@/lib/simpleFetch';

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

export interface SpotCandleServiceCandleObject {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  v_usd: number; // volume in USD
}

export type SpotCandleServiceQuery = {
  token: string;
  interval: SpotCandleServiceInterval;
  from: string | number; // ISO 8601 or UNIX milliseconds
  to?: string | number; // ISO 8601 or UNIX milliseconds
};

export class SpotCandleServiceClient {
  private host: string;

  constructor(host: string) {
    if (!host) {
      logBonsaiError('SpotCandleServiceClient', 'host not configured');
    }
    this.host = host;
  }

  private async _get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.host}/${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }

    return simpleFetch<T>(url.toString());
  }

  async getCandles(params: SpotCandleServiceQuery) {
    return this._get<SpotCandleServiceCandleObject[]>(`ohlcv/${params.token}`, {
      interval: params.interval,
      from: params.from.toString(),
      ...(params.to && { to: params.to.toString() }),
    });
  }

  get url() {
    return this.host;
  }
}

let candleServiceClient: SpotCandleServiceClient | null = null;

const getOrCreateCandleServiceClient = (apiUrl: string): SpotCandleServiceClient => {
  if (!candleServiceClient || candleServiceClient.url !== apiUrl) {
    candleServiceClient = new SpotCandleServiceClient(apiUrl);
  }
  return candleServiceClient;
};

export const getSpotCandleData = async (apiUrl: string, params: SpotCandleServiceQuery) => {
  const client = getOrCreateCandleServiceClient(apiUrl);
  return client.getCandles(params);
};
