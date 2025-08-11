import { log, logInfo } from '@/lib/telemetry';

import { SpotCandleData, SpotCandleServiceQuery } from './types';
import { transformSpotCandlesForChart } from './utils';

export class SpotCandleServiceClient {
  private host: string;

  constructor(host: string) {
    if (!host) {
      log('SpotCandleServiceClient', new Error('SpotCandleServiceClient requires a host'));
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
    try {
      const response = await this._get<SpotCandleData[]>(`ohlcv/${params.token}`, {
        interval: params.interval,
        from: params.from.toString(),
        ...(params.to && { to: params.to.toString() }),
      });

      logInfo('SpotCandleServiceClient/getCandles', {
        token: params.token,
        interval: params.interval,
        candleCount: response.length,
      });

      return transformSpotCandlesForChart(response);
    } catch (error) {
      log(
        'SpotCandleServiceClient/getCandles',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          token: params.token,
          interval: params.interval,
        }
      );
      throw error;
    }
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
