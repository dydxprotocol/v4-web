import { log } from 'console';

export type MetadataServiceInfoResponse = Record<
  string,
  {
    name: string;
    logo: string;
    urls: {
      website: string | null;
      technical_doc: string | null;
      cmc: string | null;
    };
    sector_tags: string[] | null;
    exchanges: any[] | null;
  }
>;

export type MetadataServicePricesResponse = Record<
  string,
  {
    price: number | null;
    percent_change_24h: number | null;
    volume_24h: number | null;
    market_cap: number | null;
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

export type MetadataServiceAsset = {
  id: string;
  name: string;
  logo: string;
  urls: {
    website: string | null;
    technicalDoc: string | null;
    cmc: string | null;
  };
  sectorTags: string[] | null;
  exchanges: any[] | null;
  price: number | null;
  percentChange24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
};

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
