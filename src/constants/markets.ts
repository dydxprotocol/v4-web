import { Nullable } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

export type MarketData = {
  // Unique Market id (e.g. 'ETH-USD' or 'BUFFI,uniswap_v3,0x4c1b1302220d7de5c22b495e78b72f2dd2457d45-USD')
  id: string;

  // Base asset id (e.g. 'ETH' or 'BUFFI,uniswap_v3,0x4c1b1302220d7de5c22b495e78b72f2dd2457d45')
  assetId: string;

  // Displayable Market id (e.g. 'ETH-USD' or 'BUFFI-USD')
  displayId: Nullable<string>;

  clobPairId: number;
  effectiveInitialMarginFraction: Nullable<number>;
  initialMarginFraction: Nullable<number>;
  isNew?: boolean;
  line?: Nullable<number[]>;
  name?: Nullable<string>;
  nextFundingRate?: Nullable<number>;
  openInterest?: Nullable<number>;
  openInterestUSDC?: Nullable<number>;
  oraclePrice?: Nullable<number>;
  priceChange24H?: Nullable<number>;
  priceChange24HPercent?: Nullable<number>;
  tickSizeDecimals?: Nullable<number>;
  trades24H?: Nullable<number>;
  volume24H?: Nullable<number>;
  tags?: Nullable<string[]>;
};

export enum MarketSorting {
  GAINERS = 'gainers',
  LOSERS = 'losers',
  HIGHEST_CLOB_PAIR_ID = 'highest_clob_pair_id',
}

export enum MarketFilters {
  ALL = 'all',
  NEW = 'new',
  PREDICTION_MARKET = 'Prediction Market',
  FX = 'FX',
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

// ORDER IS INTENTIONAL
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
  [MarketFilters.MEME]: {
    label: STRING_KEYS.MEME,
  },
  [MarketFilters.AI]: {
    label: STRING_KEYS.AI,
  },
  [MarketFilters.DEFI]: {
    label: STRING_KEYS.DEFI,
  },
  [MarketFilters.LAYER_1]: {
    label: STRING_KEYS.LAYER_1,
  },
  [MarketFilters.LAYER_2]: {
    label: STRING_KEYS.LAYER_2,
  },
  [MarketFilters.RWA]: {
    label: STRING_KEYS.REAL_WORLD_ASSET_SHORT,
  },
  [MarketFilters.GAMING]: {
    label: STRING_KEYS.GAMING,
  },
  [MarketFilters.FX]: {
    label: STRING_KEYS.FOREX,
    isNew: true,
  },
  [MarketFilters.NFT]: {
    label: STRING_KEYS.NFT,
  },
  [MarketFilters.ENT]: {
    label: STRING_KEYS.ENTERTAINMENT,
  },
  [MarketFilters.PREDICTION_MARKET]: {
    label: STRING_KEYS.PREDICTION_MARKET,
    isNew: true,
  },
};

export const DEFAULT_MARKETID = 'ETH-USD';

export enum FundingDirection {
  ToShort = 'ToShort',
  ToLong = 'ToLong',
  None = 'None',
}

export const PREDICTION_MARKET = {
  TRUMPWIN: 'TRUMPWIN-USD',
};

// Liquidity Tiers
export const LIQUIDITY_TIERS = {
  0: {
    label: 'Large-cap',
    initialMarginFraction: 0.05,
    maintenanceMarginFraction: 0.03,
    impactNotional: 10_000,
  },
  1: {
    label: 'Small-cap',
    initialMarginFraction: 0.1,
    maintenanceMarginFraction: 0.05,
    impactNotional: 5_000,
  },
  2: {
    label: 'Long-tail',
    initialMarginFraction: 0.2,
    maintenanceMarginFraction: 0.1,
    impactNotional: 2_500,
  },
  3: {
    label: 'Safety',
    initialMarginFraction: 1,
    maintenanceMarginFraction: 0.2,
    impactNotional: 2_500,
  },
  4: {
    label: 'Isolated',
    initialMarginFraction: 0.05,
    maintenanceMarginFraction: 0.03,
    impactNotional: 2_500,
  },
  5: {
    label: 'Mid-cap',
    initialMarginFraction: 0.05,
    maintenanceMarginFraction: 0.03,
    impactNotional: 5_000,
  },
  6: {
    label: 'FX',
    initialMarginFraction: 0.01,
    maintenanceMarginFraction: 0.0005,
    impactNotional: 2_500,
  },
};
