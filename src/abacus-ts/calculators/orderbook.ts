import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';

import { OrderbookData } from '../types/rawTypes';
import { OrderbookLine, OrderbookProcessedData } from '../types/summaryTypes';

export const calculateOrderbook = ({
  orderbook,
  _groupingMultiplier = undefined,
}: {
  orderbook: OrderbookData | undefined;
  _groupingMultiplier?: number;
}): OrderbookProcessedData | undefined => {
  if (orderbook == null) {
    return undefined;
  }

  const { asks, bids } = orderbook;

  /**
   * 1. Process raw orderbook data
   * 2. filter out lines with size <= 0
   * 3. sort by price
   */
  const asksBase: Omit<OrderbookLine, 'depth' | 'depthCost'>[] = objectEntries(asks)
    .map(mapRawOrderbookLine)
    .filter(isTruthy)
    .sort((a, b) => a.price - b.price);

  const bidsBase: Omit<OrderbookLine, 'depth' | 'depthCost'>[] = objectEntries(bids)
    .map(mapRawOrderbookLine)
    .filter(isTruthy)
    .sort((a, b) => a.price - b.price);

  // calculate depth and depthCost
  const asksComposite = calculateDepthAndDepthCost(asksBase);
  const bidsComposite = calculateDepthAndDepthCost(bidsBase);

  // un-cross orderbook
  const uncrossedBook: { asks: OrderbookLine[]; bids: OrderbookLine[] } = uncrossOrderbook(
    asksComposite,
    bidsComposite
  );

  // calculate midPrice, spread, and spreadPercent
  const lowestAsk = uncrossedBook.asks.at(0);
  const highestBid = uncrossedBook.bids.at(-1);
  const midPrice = lowestAsk && highestBid && (lowestAsk.price + highestBid.price) / 2;
  const spread = lowestAsk && highestBid && lowestAsk.price - highestBid.price;
  const spreadPercent = spread && midPrice && (spread / midPrice) * 100;

  // TODO: multiply by groupingMultiplier

  return {
    ...uncrossedBook,
    midPrice,
    spread,
    spreadPercent,
  };
};

function uncrossOrderbook(asks: OrderbookLine[], bids: OrderbookLine[]) {
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
      if (ask.size > bid.size) {
        // remove the bid
        bid = bidsCopy.pop();
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
        bid = bidsCopy.pop();
      }
    }
  }

  return { asks: asksCopy, bids: bidsCopy };
}

function calculateDepthAndDepthCost(lines: Omit<OrderbookLine, 'depth' | 'depthCost'>[]) {
  let depth = 0;
  let depthCost = 0;

  return lines.map((line) => {
    depth += line.size;
    depthCost += line.sizeCost;

    return {
      ...line,
      depth,
      depthCost,
    };
  });
}

function mapRawOrderbookLine(rawOrderbookLineEntry: [string, { size: string; offset: number }]) {
  const [price, { size, offset }] = rawOrderbookLineEntry;
  const sizeBN = MustBigNumber(size);
  const priceBN = MustBigNumber(price);

  if (sizeBN.isZero()) return undefined;

  return {
    price: priceBN.toNumber(),
    size: sizeBN.toNumber(),
    sizeCost: priceBN.times(sizeBN).toNumber(),
    offset,
  };
}

function isCrossed(
  ask: Omit<OrderbookLine, 'depth' | 'depthCost'>,
  bid: Omit<OrderbookLine, 'depth' | 'depthCost'>
) {
  return ask.price <= bid.price;
}
