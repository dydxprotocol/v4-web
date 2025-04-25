import {
  MetadataServiceCandlesResponse,
  MetadataServiceCandlesTimeframes,
  MetadataServiceInfoResponse,
  MetadataServicePath,
  MetadataServicePricesResponse,
} from '@/constants/assetMetadata';

import { log } from '@/lib/telemetry';

export class MetadataServiceClient {
  private host: string;

  constructor(host: string) {
    if (!host) {
      log('MetadataServiceClient', new Error('MetadataServiceClient requires a host'));
    }

    this.host = host;
  }

  _post(endpoint: string, params: {} = {}) {
    return fetch(`${this.host}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }).then((res) => res.json());
  }

  _get(endpoint: string) {
    return fetch(`${this.host}/${endpoint}`).then((res) => res.json());
  }

  async getMarketmap(): Promise<Record<string, string>> {
    return this._get(MetadataServicePath.MARKET_MAP);
  }

  async getAssetInfo(assets?: string[]): Promise<MetadataServiceInfoResponse> {
    return this._post(MetadataServicePath.INFO, {
      assets,
    });
  }

  async getAssetPrices(assets?: string[]): Promise<MetadataServicePricesResponse> {
    return this._post(MetadataServicePath.PRICES, {
      assets,
    });
  }

  async getCandles({
    asset,
    timeframe,
  }: {
    asset: string;
    timeframe: MetadataServiceCandlesTimeframes;
  }): Promise<MetadataServiceCandlesResponse> {
    return this._post(MetadataServicePath.CANDLES, {
      assets: [asset],
      timeframe,
    });
  }
}
