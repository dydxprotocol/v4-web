import { Nullable } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { IconName } from '@/components/Icon';

/**
 * @description MarketData used for MarketTable and List components
 */
export type MarketData = {
  // Unique Market id (e.g. 'ETH-USD' or 'BUFFI,uniswap_v3,0x4c1b1302220d7de5c22b495e78b72f2dd2457d45-USD')
  id: string;

  // Base asset id (e.g. 'ETH' or 'BUFFI,uniswap_v3,0x4c1b1302220d7de5c22b495e78b72f2dd2457d45')
  assetId: string;

  // Displayable Market id (e.g. 'ETH-USD' or 'BUFFI-USD')
  displayId: Nullable<string>;

  // Displayable asset id so just 'ETH' or 'BUFFI
  displayableAsset: Nullable<string>;

  clobPairId: string;
  effectiveInitialMarginFraction: Nullable<number>;
  logo: string;
  initialMarginFraction: Nullable<number>;
  isNew: boolean;
  isUnlaunched?: boolean;
  sparkline24h: Nullable<number[]>;
  name: string;
  nextFundingRate: Nullable<number>;
  openInterest: Nullable<number>;
  openInterestUSDC: Nullable<number>;
  oraclePrice: Nullable<number>;
  priceChange24h: Nullable<number>;
  percentChange24h: Nullable<number>;
  tickSizeDecimals: number;
  trades24h: Nullable<number>;
  volume24h: Nullable<number>;
  spotVolume24h: Nullable<number>;
  marketCap: Nullable<number>;
  sectorTags: Nullable<string[]>;
  isFavorite: boolean;
};

export enum MarketSorting {
  GAINERS = 'gainers',
  LOSERS = 'losers',
  RECENTLY_LISTED = 'recently-listed',
}

export enum MarketFilters {
  ALL = 'all',
  FAVORITE = 'favorite',
  NEW = 'new',
  PREDICTION_MARKET = 'prediction-market',

  // CMC Sector Tags.
  FX = 'fiat',
  LAYER_1 = 'layer-1',
  LAYER_2 = 'layer-2',
  DEFI = 'defi',
  AI = 'ai-big-data',
  DEPIN = 'depin',
  GAMING = 'gaming',
  MEMES = 'memes',
  RWA = 'real-world-assets',
  LAUNCHABLE = 'launchable',
}
export enum HiddenMarketFilterTags {
  DEX = 'decentralized-exchange-dex-token',
}
// ORDER IS INTENTIONAL
export const MARKET_FILTER_OPTIONS: Record<
  MarketFilters,
  {
    labelIconName?: IconName;
    labelStringKey?: string;
    isNew?: boolean;
  }
> = {
  [MarketFilters.ALL]: {
    labelStringKey: STRING_KEYS.ALL,
  },
  [MarketFilters.FAVORITE]: {
    labelIconName: IconName.Star,
  },
  [MarketFilters.NEW]: {
    labelStringKey: STRING_KEYS.RECENTLY_LISTED,
  },
  [MarketFilters.LAUNCHABLE]: {
    labelStringKey: STRING_KEYS.LAUNCHABLE,
    isNew: true,
  },
  [MarketFilters.MEMES]: {
    labelStringKey: STRING_KEYS.MEME,
  },
  [MarketFilters.AI]: {
    labelStringKey: STRING_KEYS.AI_BIG_DATA,
  },
  [MarketFilters.DEFI]: {
    labelStringKey: STRING_KEYS.DEFI,
  },
  [MarketFilters.DEPIN]: {
    labelStringKey: STRING_KEYS.DEPIN,
  },
  [MarketFilters.LAYER_1]: {
    labelStringKey: STRING_KEYS.LAYER_1,
  },
  [MarketFilters.LAYER_2]: {
    labelStringKey: STRING_KEYS.LAYER_2,
  },
  [MarketFilters.RWA]: {
    labelStringKey: STRING_KEYS.REAL_WORLD_ASSET_SHORT,
  },
  [MarketFilters.GAMING]: {
    labelStringKey: STRING_KEYS.GAMING,
  },
  [MarketFilters.FX]: {
    labelStringKey: STRING_KEYS.FOREX,
  },
  [MarketFilters.PREDICTION_MARKET]: {
    labelStringKey: STRING_KEYS.PREDICTION_MARKET,
    isNew: true,
  },
};

export const DEFAULT_MARKETID = 'BTC-USD';
export const DEFAULT_QUOTE_ASSET = 'USD';

export const PREDICTION_MARKET = {
  TRUMPWIN: 'TRUMPWIN-USD',
};

export const ISOLATED_LIQUIDITY_TIER_INFO = {
  label: 'Isolated',
  initialMarginFraction: 0.05,
  maintenanceMarginFraction: 0.03,
  impactNotional: 2_500,
};

export const SEVEN_DAY_SPARKLINE_ENTRIES = 42;
