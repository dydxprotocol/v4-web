import {
  MetadataServiceCandleResolutions,
  MetadataServiceCandlesResponse,
  MetadataServiceInfoResponse,
  MetadataServicePath,
  MetadataServicePricesResponse,
} from '@/constants/assetMetadata';

import { log } from '@/lib/telemetry';

/**
 * MetadataServiceClient
 * @description client to fetch metadata info, prices, and candles
 */
class MetadataServiceClient {
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
    assets,
    resolution,
  }: {
    assets?: string[];
    resolution: MetadataServiceCandleResolutions;
  }): Promise<MetadataServiceCandlesResponse> {
    return this._post(MetadataServicePath.CANDLES, {
      assets,
      resolution,
    });
  }
}

const METADATA_URI: string = import.meta.env.VITE_METADATA_SERVICE_URI ?? '';
const metadataClient = new MetadataServiceClient(METADATA_URI);
export default metadataClient;
