import { Asset, PerpetualMarket } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

export type MarketData = {
  asset: Asset;
  tickSizeDecimals: number;
  isNew?: boolean;
} & PerpetualMarket &
  PerpetualMarket['perpetual'] &
  PerpetualMarket['configs'];

export enum MarketFilters {
  ALL = 'all',
  NEW = 'new',
  LAYER_1 = 'Layer 1',
  DEFI = 'Defi',
  AI = 'AI',
  LAYER_2 = 'Layer 2',
  NFT = 'NFT',
  GAMING = 'Gaming',
}

export const MARKET_FILTER_LABELS = {
  [MarketFilters.ALL]: STRING_KEYS.ALL,
  [MarketFilters.NEW]: STRING_KEYS.NEW,
  [MarketFilters.LAYER_1]: STRING_KEYS.LAYER_1,
  [MarketFilters.DEFI]: STRING_KEYS.DEFI,
  [MarketFilters.AI]: STRING_KEYS.DEFI,
  [MarketFilters.LAYER_2]: STRING_KEYS.DEFI,
  [MarketFilters.NFT]: STRING_KEYS.DEFI,
  [MarketFilters.GAMING]: STRING_KEYS.DEFI,
};

export const DEFAULT_MARKETID = 'ETH-USD';

export enum FundingDirection {
  ToShort = 'ToShort',
  ToLong = 'ToLong',
  None = 'None',
}
