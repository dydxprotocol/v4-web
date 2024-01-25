//  ------ Canvas helper methods ------ //

import type { MarketOrderbook, Nullable, PerpetualMarketOrderbookLevel } from '@/constants/abacus';

/**
 * @returns top left x,y and bottom x,y from array idx
 */
export const getRektFromIdx = ({
  idx,
  canvasWidth,
  canvasHeight,
  rowHeight,
  side = 'bid',
}: {
  idx: number;
  canvasWidth: number;
  canvasHeight: number;
  rowHeight: number;
  side: PerpetualMarketOrderbookLevel['side'];
}) => {
  /**
   * Does not change
   */
  const x1 = 0;
  const x2 = Math.floor(canvasWidth);

  /**
   * Changes based on side
   * Asks: The drawing should starts from the bottom of the orderbook
   */
  if (side === 'ask') {
    const y1 = Math.floor(canvasHeight - (idx + 1) * rowHeight);
    const y2 = Math.floor(y1 + rowHeight);
    return { x1, x2, y1, y2 };
  }

  const y1 = Math.floor(idx * rowHeight);
  const y2 = Math.floor(y1 + rowHeight);
  return { x1, x2, y1, y2 };
};

/**
 * @returns y value for text and bar
 */
export const getYForElements = ({ y, rowHeight }: { y: number; rowHeight: number }) => ({
  text: Math.floor(y + rowHeight / 2),
  bar: Math.floor(y + 1),
});

/**
 * @description X coordinate for text
 * @returns Get X value by column, colIdx starts at 0
 */
export const getXByColumn = ({ canvasWidth, colIdx }: { canvasWidth: number; colIdx: number }) => {
  return Math.floor(((colIdx + 1) * canvasWidth) / 3);
};

/**
 *         to === 'right'                to === 'left'
 *         |===================|         |===================|
 * bar:    a                   b         c                   d
 * a = 0
 * b = depthBarWidth
 * c = canvasWidth - depthBarWidth
 * d = canvasWidth
 *
 */
export const getHistogramXValues = ({
  barWidth,
  canvasWidth,
  gradientMultiplier,
  histogramSide,
}: {
  barWidth: number;
  canvasWidth: number;
  gradientMultiplier: number;
  histogramSide: 'left' | 'right';
}) => {
  const gradient = {
    x1: Math.floor(histogramSide === 'left' ? barWidth : canvasWidth - barWidth),
    x2: Math.floor(
      histogramSide === 'left'
        ? 0 - (canvasWidth * gradientMultiplier - canvasWidth)
        : canvasWidth * gradientMultiplier
    ),
  };
  const bar = {
    x1: Math.floor(histogramSide === 'left' ? 0 : canvasWidth - barWidth),
    x2: Math.floor(histogramSide === 'left' ? Math.min(barWidth, canvasWidth) : canvasWidth),
  };

  return {
    bar,
    gradient,
  };
};

// ------ Orderbook helper methods ------ //
export const processOrderbookToCreateMap = ({
  orderbookMap,
  newOrderbook,
}: {
  orderbookMap?: {
    asks: Record<string, number>;
    bids: Record<string, number>;
  };
  newOrderbook: Nullable<MarketOrderbook>;
}) => {
  // Create Orderbooks Map indexed by Price
  const asks = newOrderbook?.asks?.toArray() ?? [];
  const bids = newOrderbook?.bids?.toArray() ?? [];
  const prevAsks = orderbookMap?.asks ?? {};
  const prevBids = orderbookMap?.bids ?? {};
  const newAsks = Object.fromEntries(asks.map((ask) => [ask.price, ask.size]) ?? {});
  const newBids = Object.fromEntries(bids.map((bid) => [bid.price, bid.size]) ?? {});

  Object.keys(prevAsks).forEach((price) => {
    if (!newAsks[price] || newAsks[price] === 0) {
      newAsks[price] = 0;
    }
  });

  Object.keys(prevBids).forEach((price) => {
    if (!newBids[price] || newBids[price] === 0) {
      newBids[price] = 0;
    }
  });

  return {
    newAsks,
    newBids,
  };
};
