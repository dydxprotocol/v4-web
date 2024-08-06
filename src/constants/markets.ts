import { Asset, Nullable, PerpetualMarket } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

export type MarketData = {
  asset: Asset;
  tickSizeDecimals: Nullable<number>;
  oneDaySparkline?: number[];
  isNew?: boolean;
  clobPairId: number;
} & PerpetualMarket &
  PerpetualMarket['perpetual'] &
  PerpetualMarket['configs'];

export enum MarketSorting {
  GAINERS = 'gainers',
  LOSERS = 'losers',
  HIGHEST_CLOB_PAIR_ID = 'highest_clob_pair_id',
}

export enum MarketFilters {
  ALL = 'all',
  NEW = 'new',
  PREDICTION_MARKET = 'Prediction Market',
  LAYER_1 = 'Layer 1',
  LAYER_2 = 'Layer 2',
  DEFI = 'Defi',
  AI = 'AI',
  NFT = 'NFT',
  GAMING = 'Gaming',
  MEME = 'Meme',
  RWA = 'RWA',
  ENT = 'Entertainment',
}

export const MARKET_FILTER_OPTIONS: Record<
  MarketFilters,
  {
    label?: string;
    isNew?: boolean;
  }
> = {
  [MarketFilters.ALL]: {
    label: STRING_KEYS.ALL,
  },
  [MarketFilters.NEW]: {
    label: STRING_KEYS.RECENTLY_LISTED,
  },
  [MarketFilters.PREDICTION_MARKET]: {
    label: STRING_KEYS.PREDICTION_MARKET,
    isNew: true,
  },
  [MarketFilters.LAYER_1]: {
    label: STRING_KEYS.LAYER_1,
  },
  [MarketFilters.LAYER_2]: {
    label: STRING_KEYS.LAYER_2,
  },
  [MarketFilters.DEFI]: {
    label: STRING_KEYS.DEFI,
  },
  [MarketFilters.AI]: {
    label: STRING_KEYS.AI,
  },
  [MarketFilters.NFT]: {
    label: STRING_KEYS.NFT,
  },
  [MarketFilters.GAMING]: {
    label: STRING_KEYS.GAMING,
  },
  [MarketFilters.MEME]: {
    label: STRING_KEYS.MEME,
  },
  [MarketFilters.RWA]: {
    label: STRING_KEYS.REAL_WORLD_ASSET_SHORT,
  },
  [MarketFilters.ENT]: {
    label: STRING_KEYS.ENTERTAINMENT,
  },
};

export const DEFAULT_MARKETID = 'ETH-USD';

export enum FundingDirection {
  ToShort = 'ToShort',
  ToLong = 'ToLong',
  None = 'None',
}
