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

export type MetadataServiceCandlesResponse = Record<
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

  tickSizeDecimals: number;
};

export enum MetadataServicePath {
  MARKET_MAP = 'market-map',
  INFO = 'info',
  PRICES = 'prices',
  CANDLES = 'candles',
}

export type MetadataServiceCandleResolutions = '1d' | '7d' | '30d';
