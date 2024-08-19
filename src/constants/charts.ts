import { Nullable } from '@dydxprotocol/v4-abacus';
import { OrderSide } from '@dydxprotocol/v4-client-js';

import { FundingDirection } from './markets';

export const TOGGLE_ACTIVE_CLASS_NAME = 'toggle-active';

// ------ Depth Chart ------ //
export enum DepthChartSeries {
  Asks = 'Asks',
  Bids = 'Bids',
  MidMarket = 'MidMarket',
}

export type DepthChartDatum = {
  size: number;
  price: number;
  depth: Nullable<number>;
  depthCost: number;
  seriesKey: DepthChartSeries;
};

export type DepthChartPoint = {
  side: OrderSide;
  price: number;
  size: number;
};

export const SERIES_KEY_FOR_ORDER_SIDE = {
  [OrderSide.BUY]: DepthChartSeries.Bids,
  [OrderSide.SELL]: DepthChartSeries.Asks,
};

// ------ Funding Chart ------ //
export enum FundingRateResolution {
  OneHour = 'OneHour',
  EightHour = 'EightHour',
  Annualized = 'Annualized',
}

export type FundingChartDatum = {
  time: number;
  fundingRate: number;
  direction: FundingDirection;
};

// ------ Trading Rewards Chart ------ //
export type TradingRewardsDatum = {
  date: number;
  cumulativeAmount: number;
};

export enum TradingRewardsPeriod {
  Period1d = 'Period1d',
  Period7d = 'Period7d',
  Period30d = 'Period30d',
  Period90d = 'Period90d',
  PeriodAllTime = 'PeriodAllTime',
}

export const tradingRewardsPeriods = Object.keys(TradingRewardsPeriod) as TradingRewardsPeriod[];
