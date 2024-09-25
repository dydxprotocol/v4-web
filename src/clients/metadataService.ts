import { log } from 'console';

type MetadataServiceInfoResponse = Record<
  string,
  {
    name: string;
    logo: string;
    urls: {
      website: string;
      technical_doc: string;
      cmc: string;
    };
    sector_tags: string[];
    exchanges: string[];
  }
>;

type MetadataServicePricesResponse = Record<
  string,
  {
    price: number;
    percent_change_24h: number;
    volume_24h: number;
    market_cap: number;
  }
>;

type MetadataServiceCandlesResponse = Record<
  string,
  {
    time: string; // ISO date string
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }
>;

enum MetadataServicePath {
  MARKET_MAP = 'market-map',
  INFO = 'info',
  PRICES = 'prices',
  CANDLES = 'candles',
}

/**
 * MetadataServiceClient
 * @description client to fetch metadata info, prices, and candles
 */
class MetadataServiceClient {
  private host: string;

  constructor(host: string) {
    if (!host) {
      log('MetadataServiceClient requires a host');
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

  async getAssetInfo({ assets }: { assets?: string[] }): Promise<MetadataServiceInfoResponse> {
    return this._post(MetadataServicePath.INFO, {
      assets,
    });
  }

  async getAssetPrices({ assets }: { assets?: string[] }): Promise<MetadataServicePricesResponse> {
    return this._post(MetadataServicePath.PRICES, {
      assets,
    });
  }

  async getCandles({
    assets,
    resolution,
  }: {
    assets?: string[];
    resolution: '1d' | '7d' | '30d';
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
