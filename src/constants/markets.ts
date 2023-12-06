import { Asset, PerpetualMarket } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

export type MarketData = {
  asset: Asset;
  tickSizeDecimals: number;
} & PerpetualMarket &
  PerpetualMarket['perpetual'] &
  PerpetualMarket['configs'];

export enum MarketFilters {
  ALL = 'all',
  LAYER_1 = 'Layer 1',
  DEFI = 'Defi',
}

export const MARKET_FILTER_LABELS = {
  [MarketFilters.ALL]: STRING_KEYS.ALL,
  [MarketFilters.LAYER_1]: STRING_KEYS.LAYER_1,
  [MarketFilters.DEFI]: STRING_KEYS.DEFI,
};

export const DEFAULT_MARKETID = 'ETH-USD';

export enum FundingDirection {
  ToShort = 'ToShort',
  ToLong = 'ToLong',
}

export const MARKETS_TO_DISPLAY = [
  'BTC-USD',
  'ETH-USD',
  'LINK-USD',
  'SOL-USD',
  'MATIC-USD',
  'ATOM-USD',
  'AVAX-USD',
  'APE-USD',
  'XRP-USD',
  'UNI-USD',
  'ADA-USD',
  'TRX-USD',
  'OP-USD',
  'MKR-USD',
  'DOGE-USD',
  'SHIB-USD',
  'COMP-USD',
  'LDO-USD',
  'NEAR-USD',
  'APT-USD',
  'SUI-USD',
  'DOT-USD',
  'ETC-USD',
  'ARB-USD',
  'CRV-USD',
  'BLUR-USD',
  'FIL-USD',
  'XLM-USD',
  'PEPE-USD',
  'WLD-USD',
  'SEI-USD',
  'LTC-USD',
  'BCH-USD',
];
