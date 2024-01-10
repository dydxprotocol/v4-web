import { OrderSide } from '@dydxprotocol/v4-client-js';

// ------ Depth Chart ------ //
export enum DepthChartSeries {
  Asks = 'Asks',
  Bids = 'Bids',
  MidMarket = 'MidMarket',
}

export type DepthChartDatum = {
  size: number;
  price: number;
  depth: number;
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
