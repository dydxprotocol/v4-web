import { DepthChartSeries } from '@/constants/charts';

export type OrderbookLine = {
  price: number;
  size: number;
  depth: number;
  sizeCost: number;
  depthCost: number;
  offset: number;
};

export type OrderbookProcessedData = {
  asks: OrderbookLine[] | CanvasOrderbookLine[];
  bids: OrderbookLine[] | CanvasOrderbookLine[];
  midPrice: number | undefined;
  spread: number | undefined;
  spreadPercent: number | undefined;
};

export type CanvasOrderbookLine = OrderbookLine & {
  mine: number | undefined;
  side: 'ask' | 'bid';
};

type DepthChartDatum = OrderbookLine & {
  seriesKey: DepthChartSeries;
};

export type DepthChartData = {
  asks: DepthChartDatum[];
  bids: DepthChartDatum[];
  midPrice: number | undefined;
  spread: number | undefined;
  spreadPercent: number | undefined;
  lowestBid: DepthChartDatum | undefined;
  highestBid: DepthChartDatum | undefined;
  lowestAsk: DepthChartDatum | undefined;
  highestAsk: DepthChartDatum | undefined;
};
