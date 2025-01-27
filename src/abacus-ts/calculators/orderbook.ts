import BigNumber from 'bignumber.js';
import { weakMapMemoize } from 'reselect';

import { isTruthy } from '@/lib/isTruthy';
import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';

import { OrderbookData } from '../types/rawTypes';
import { OrderbookLine, OrderbookProcessedData } from '../types/summaryTypes';

type OrderbookLineBN = {
  price: BigNumber;
  size: BigNumber;
  sizeCost: BigNumber;
  offset: number;
  depth?: BigNumber;
  depthCost?: BigNumber;
};

export const calculateOrderbook = weakMapMemoize(
  (orderbook: OrderbookData | undefined): OrderbookProcessedData | undefined => {
    if (orderbook == null) {
      return undefined;
    }

    const { asks, bids } = orderbook;

    /**
     * 1. Process raw orderbook data
     * 2. filter out lines with size <= 0
     * 3. sort by price
     */
    const asksBase: OrderbookLineBN[] = objectEntries(asks)
      .map(mapRawOrderbookLineToBN)
      .filter(isTruthy)
      .sort((a, b) => a.price.minus(b.price).toNumber());

    const bidsBase: OrderbookLineBN[] = objectEntries(bids)
      .map(mapRawOrderbookLineToBN)
      .filter(isTruthy)
      .sort((a, b) => a.price.minus(b.price).toNumber());

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
      bids: uncrossedBook.bids.map(mapOrderbookLineToNumber),
      asks: uncrossedBook.asks.map(mapOrderbookLineToNumber),
      midPrice: midPriceBN?.toNumber(),
      spread: spreadBN?.toNumber(),
      spreadPercent: spreadPercentBN?.toNumber(),
    };
  }
);

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
      if (ask.size.gt(bid.size)) {
        // remove the bid
        bid = bidsCopy.shift();
      } else {
        // remove the ask
        ask = asksCopy.shift();
      }
    } else {
      // If offsets are different, remove the older offset.
      if (ask.offset < bid.offset) {
        // remove the ask
        ask = asksCopy.shift();
      } else {
        // remove the bid
        bid = bidsCopy.shift();
      }
    }
  }

  return { asks: asksCopy, bids: bidsCopy };
}

function calculateDepthAndDepthCost(lines: OrderbookLineBN[]) {
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

function mapOrderbookLineToNumber(orderbookLineBN: OrderbookLineBN): OrderbookLine {
  const { price, size, sizeCost, depth, depthCost, offset } = orderbookLineBN;

  return {
    price: price.toNumber(),
    size: size.toNumber(),
    sizeCost: sizeCost.toNumber(),
    offset,
    depth: depth?.toNumber() ?? 0,
    depthCost: depthCost?.toNumber() ?? 0,
  };
}

function isCrossed(ask: OrderbookLineBN, bid: OrderbookLineBN) {
  return ask.price.lte(bid.price);
}
