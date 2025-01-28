import BigNumber from 'bignumber.js';
import { weakMapMemoize } from 'reselect';

import { GroupingMultiplier } from '@/constants/orderbook';

import { isTruthy } from '@/lib/isTruthy';
import { BIG_NUMBERS, MustBigNumber, roundToNearestFactor } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';

import { OrderbookData } from '../types/rawTypes';
import { OrderbookLine } from '../types/summaryTypes';

type OrderbookLineBN = {
  price: BigNumber;
  size: BigNumber;
  sizeCost: BigNumber;
  offset: number;
  depth: BigNumber;
  depthCost: BigNumber;
};

export const calculateOrderbook = weakMapMemoize((orderbook: OrderbookData | undefined) => {
  if (orderbook == null) {
    return undefined;
  }

  const { asks, bids } = orderbook;

  /**
   * 1. Process raw orderbook data and
   * 2. filter out lines with size <= 0
   * 3. sort by price: asks ascending, bids descending
   */
  const asksBase: Omit<OrderbookLineBN, 'depth' | 'depthCost'>[] = objectEntries(asks)
    .map(mapRawOrderbookLineToBN)
    .filter(isTruthy)
    .sort((a, b) => a.price.minus(b.price).toNumber());

  const bidsBase: Omit<OrderbookLineBN, 'depth' | 'depthCost'>[] = objectEntries(bids)
    .map(mapRawOrderbookLineToBN)
    .filter(isTruthy)
    .sort((a, b) => b.price.minus(a.price).toNumber());

  // calculate depth and depthCost
  const asksComposite = calculateDepthAndDepthCost(asksBase);
  const bidsComposite = calculateDepthAndDepthCost(bidsBase);

  // un-cross orderbook
  const uncrossedBook: { asks: OrderbookLineBN[]; bids: OrderbookLineBN[] } = uncrossOrderbook(
    asksComposite,
    bidsComposite
  );

  // calculate midPrice, spread, and spreadPercent
  const lowestAsk = uncrossedBook.asks.at(0);
  const highestBid = uncrossedBook.bids.at(-1);
  const midPriceBN = lowestAsk && highestBid && lowestAsk.price.plus(highestBid.price).div(2);
  const spreadBN = lowestAsk && highestBid && lowestAsk.price.minus(highestBid.price);
  const spreadPercentBN = spreadBN && midPriceBN && spreadBN.div(midPriceBN).times(100);

  return {
    bids: uncrossedBook.bids,
    asks: uncrossedBook.asks,
    midPrice: midPriceBN,
    spread: spreadBN,
    spreadPercent: spreadPercentBN,
  };
});

function uncrossOrderbook(asks: OrderbookLineBN[], bids: OrderbookLineBN[]) {
  if (asks.length === 0 || bids.length === 0) {
    return { asks, bids };
  }

  const asksCopy = [...asks];
  const bidsCopy = [...bids];

  let ask = asksCopy.at(-1);
  let bid = bidsCopy.at(0);

  while (ask && bid && isCrossed(ask, bid)) {
    if (ask.offset === bid.offset) {
      // If offsets are the same, give precedence to the larger size. In this case,
      // one of the sizes "should" be zero, but we simply check for the larger size.
      if (ask.size.gte(bid.size)) {
        // remove the bid
        bidsCopy.shift();
        bid = bidsCopy.at(0);
      } else {
        // remove the ask
        asksCopy.pop();
        ask = asksCopy.at(-1);
      }
    } else {
      // If offsets are different, remove the older offset.
      if (ask.offset < bid.offset) {
        // remove the ask
        asksCopy.pop();
        ask = asksCopy.at(-1);
      } else {
        // remove the bid
        bidsCopy.shift();
        bid = bidsCopy.at(0);
      }
    }
  }

  return { asks: asksCopy, bids: bidsCopy };
}

function calculateDepthAndDepthCost(
  lines: Omit<OrderbookLineBN, 'depth' | 'depthCost'>[]
): OrderbookLineBN[] {
  let depth = BIG_NUMBERS.ZERO;
  let depthCost = BIG_NUMBERS.ZERO;

  return lines.map((line) => {
    depth = depth.plus(line.size);
    depthCost = depthCost.plus(line.sizeCost);

    return {
      ...line,
      depth,
      depthCost,
    };
  });
}

function mapRawOrderbookLineToBN(
  rawOrderbookLineEntry: [string, { size: string; offset: number }]
) {
  const [price, { size, offset }] = rawOrderbookLineEntry;
  const sizeBN = MustBigNumber(size);
  const priceBN = MustBigNumber(price);

  if (sizeBN.isZero()) return undefined;

  return {
    price: priceBN,
    size: sizeBN,
    sizeCost: priceBN.times(sizeBN),
    offset,
  };
}

export function mapOrderbookLineToNumber(orderbookLineBN: OrderbookLineBN): OrderbookLine {
  const { price, size, sizeCost, depth, depthCost, offset } = orderbookLineBN;

  return {
    price: price.toNumber(),
    size: size.toNumber(),
    sizeCost: sizeCost.toNumber(),
    offset,
    depth: depth.toNumber(),
    depthCost: depthCost.toNumber(),
  };
}

function isCrossed(ask: OrderbookLineBN, bid: OrderbookLineBN) {
  return ask.price.lte(bid.price);
}

const getGroupingTickSize = (tickSize: string, multiplier: GroupingMultiplier) => {
  return MustBigNumber(tickSize).times(multiplier).toNumber();
};

/**
 *
 * @param orderbook
 * @param groupingTickSize
 * @param shouldFloor we want to round asks up and bids down so they don't have an overlapping group in the middle
 * @returns grouped orderbook side or null
 */
const group = weakMapMemoize(
  (
    orderbook: OrderbookLineBN[],
    groupingTickSize: number,
    shouldFloor?: boolean
  ): OrderbookLineBN[] | null => {
    if (orderbook.length === 0) {
      return null;
    }

    const result: OrderbookLineBN[] = [];

    orderbook.forEach((line) => {
      const price = roundToNearestFactor({
        number: line.price,
        factor: groupingTickSize,
        roundingMode: shouldFloor ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP,
      });

      const existingLine = result.find((r) => r.price.eq(price));

      if (existingLine) {
        existingLine.size = existingLine.size.plus(line.size);
        existingLine.sizeCost = existingLine.sizeCost.plus(line.sizeCost);
        existingLine.depth = line.depth;
        existingLine.depthCost = line.depthCost;
      } else {
        // Asks are ascending and bids are descending, so we need to unshift asks and push bids
        if (shouldFloor) {
          result.push({
            ...line,
            price,
          });
        } else {
          result.unshift({
            ...line,
            price,
          });
        }
      }
    });

    return result;
  }
);

function roundMidPrice(
  lowestAsk: OrderbookLineBN | undefined,
  highestBid: OrderbookLineBN | undefined,
  groupingTickSize: number
) {
  if (!lowestAsk || !highestBid) {
    return undefined;
  }

  const roundedMidPrice = roundToNearestFactor({
    number: lowestAsk.price.plus(highestBid.price).div(2),
    factor: groupingTickSize,
    roundingMode: BigNumber.ROUND_HALF_UP,
  });

  return roundedMidPrice.eq(lowestAsk!.price) || roundedMidPrice.eq(highestBid!.price)
    ? roundToNearestFactor({
        number: lowestAsk!.price.plus(highestBid!.price).div(2),
        factor: groupingTickSize / 10,
        roundingMode: BigNumber.ROUND_HALF_UP,
      })
    : roundedMidPrice;
}

export const groupOrderbook = weakMapMemoize(
  (
    currentMarketOrderbook: ReturnType<typeof calculateOrderbook>,
    groupingMultiplier: GroupingMultiplier,
    tickSize: string
  ) => {
    if (currentMarketOrderbook == null) {
      return undefined;
    }

    const groupingTickSize = getGroupingTickSize(tickSize, groupingMultiplier);
    const { asks, bids } = currentMarketOrderbook;
    const groupedAsks = group(asks, groupingTickSize);
    const groupedBids = group(bids, groupingTickSize, true);
    const lowestAsk = groupedAsks?.at(-1);
    const highestBid = groupedBids?.at(0);

    return {
      asks: groupedAsks?.map(mapOrderbookLineToNumber) ?? [],
      bids: groupedBids?.map(mapOrderbookLineToNumber) ?? [],
      spread: currentMarketOrderbook.spread?.toNumber(),
      spreadPercent: currentMarketOrderbook.spreadPercent?.toNumber(),
      midPrice: roundMidPrice(lowestAsk, highestBid, groupingTickSize)?.toNumber(),
    };
  }
);
