import BigNumber from 'bignumber.js';

import { DepthChartSeries } from '@/constants/charts';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

export interface SubaccountOpenOrderPriceMap {
  [IndexerOrderSide.BUY]: {
    [price: string]: BigNumber;
  };
  [IndexerOrderSide.SELL]: {
    [price: string]: BigNumber;
  };
}

export type OrderbookLine = {
  price: number;
  size: number;
  depth: number;
  sizeCost: number;
  depthCost: number;
  offset: number;
};

export type CanvasOrderbookLine = OrderbookLine & {
  mine: number | undefined;
  side: 'ask' | 'bid';
};

export type OrderbookProcessedData = {
  asks: CanvasOrderbookLine[];
  bids: CanvasOrderbookLine[];
  midPrice: number | undefined;
  spread: number | undefined;
  spreadPercent: number | undefined;
  groupingTickSize: number;
  groupingTickSizeDecimals: number;
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
