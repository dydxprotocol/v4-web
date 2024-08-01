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

export const MARKET_FILTER_LABELS = {
  [MarketFilters.ALL]: STRING_KEYS.ALL,
  [MarketFilters.NEW]: STRING_KEYS.RECENTLY_LISTED,
  [MarketFilters.PREDICTION_MARKET]: undefined,
  [MarketFilters.LAYER_1]: STRING_KEYS.LAYER_1,
  [MarketFilters.LAYER_2]: STRING_KEYS.LAYER_2,
  [MarketFilters.DEFI]: STRING_KEYS.DEFI,
  [MarketFilters.AI]: STRING_KEYS.AI,
  [MarketFilters.NFT]: STRING_KEYS.NFT,
  [MarketFilters.GAMING]: STRING_KEYS.GAMING,
  [MarketFilters.MEME]: STRING_KEYS.MEME,
  [MarketFilters.RWA]: STRING_KEYS.REAL_WORLD_ASSET_SHORT,
  [MarketFilters.ENT]: STRING_KEYS.ENTERTAINMENT,
};

export const DEFAULT_MARKETID = 'ETH-USD';

export enum FundingDirection {
  ToShort = 'ToShort',
  ToLong = 'ToLong',
  None = 'None',
}
