import { logBonsaiError } from '@/bonsai/logs';

import { SpotCandleData, SpotCandleServiceQuery } from './types';
import { transformSpotCandlesForChart } from './utils';

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

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getCandles(params: SpotCandleServiceQuery) {
    const response = await this._get<SpotCandleData[]>(`ohlcv/${params.token}`, {
      interval: params.interval,
      from: params.from.toString(),
      ...(params.to && { to: params.to.toString() }),
    });

    return transformSpotCandlesForChart(response);
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
