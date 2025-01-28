import BigNumber from 'bignumber.js';
import { orderBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { SMALL_USD_DECIMALS } from '@/constants/numbers';
import { GroupingMultiplier } from '@/constants/orderbook';

import { isTruthy } from '@/lib/isTruthy';
import { BIG_NUMBERS, MustBigNumber, roundToNearestFactor } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';
import { orEmptyRecord } from '@/lib/typeUtils';

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

type RawOrderbookLineBN = Omit<OrderbookLineBN, 'depth' | 'depthCost'>;

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
  const sortedAsks: RawOrderbookLineBN[] = orderBy(
    objectEntries(asks).map(mapRawOrderbookLineToBN).filter(isTruthy),
    priceBNToNumber,
    'asc'
  );

  const sortedBids: RawOrderbookLineBN[] = orderBy(
    objectEntries(bids).map(mapRawOrderbookLineToBN).filter(isTruthy),
    priceBNToNumber,
    'desc'
  );

  // un-cross orderbook
  const {
    asks: uncrossedAsks,
    bids: uncrossedBids,
  }: {
    asks: RawOrderbookLineBN[];
    bids: RawOrderbookLineBN[];
  } = uncrossOrderbook(sortedAsks, sortedBids);

  // calculate depth and depthCost
  const processedAsks: OrderbookLineBN[] = calculateDepthAndDepthCost(uncrossedAsks);
  const processedBids: OrderbookLineBN[] = calculateDepthAndDepthCost(uncrossedBids);

  // calculate midPrice, spread, and spreadPercent
  const lowestAsk = processedAsks.at(0);
  const highestBid = processedBids.at(0);
  const midPriceBN = lowestAsk && highestBid && lowestAsk.price.plus(highestBid.price).div(2);
  const spreadBN = lowestAsk && highestBid && lowestAsk.price.minus(highestBid.price);
  const spreadPercentBN = spreadBN && midPriceBN && spreadBN.div(midPriceBN).times(100);

  return {
    bids: processedBids,
    asks: processedAsks,
    midPrice: midPriceBN,
    spread: spreadBN,
    spreadPercent: spreadPercentBN,
  };
});

/**
 * @description: final formatting for displaying the orderbook data.
 * @returns asks and bids in a sorted list or a map, along with spread, spreadPercent, and midPrice
 */
export const formatOrderbook = weakMapMemoize(
  (
    currentMarketOrderbook: ReturnType<typeof calculateOrderbook>,
    groupingMultiplier: GroupingMultiplier,
    tickSize: string
  ) => {
    if (currentMarketOrderbook == null) {
      return undefined;
    }

    // If groupingMultiplier is ONE, return the orderbook as is.
    if (groupingMultiplier === GroupingMultiplier.ONE) {
      const tickSizeDecimals = MustBigNumber(tickSize).dp() ?? SMALL_USD_DECIMALS;

      return {
        asks: orderBy(
          currentMarketOrderbook.asks.map(mapOrderbookLineToNumber),
          (ask) => ask.price,
          'desc'
        ),
        bids: currentMarketOrderbook.bids.map(mapOrderbookLineToNumber),
        asksMap: Object.fromEntries(
          currentMarketOrderbook.asks.map((line) => [
            line.price.toFixed(tickSizeDecimals),
            mapOrderbookLineToNumber(line),
          ])
        ),
        bidsMap: Object.fromEntries(
          currentMarketOrderbook.bids.map((line) => [
            line.price.toFixed(tickSizeDecimals),
            mapOrderbookLineToNumber(line),
          ])
        ),
        spread: currentMarketOrderbook.spread?.toNumber(),
        spreadPercent: currentMarketOrderbook.spreadPercent?.toNumber(),
        midPrice: currentMarketOrderbook.midPrice?.toNumber(),
      };
    }

    const groupingTickSize = getGroupingTickSize(tickSize, groupingMultiplier);
    const { asks, bids } = currentMarketOrderbook;
    const groupedAsks = orEmptyRecord(group(asks, groupingTickSize));
    const groupedBids = orEmptyRecord(group(bids, groupingTickSize, true));

    // Convert groupedAsks and groupedBids to list and sort by price. Asks will now be descending and bids will be remain descending
    const asksList = orderBy(
      Object.values(groupedAsks).map(mapOrderbookLineToNumber),
      (ask) => ask.price,
      'desc'
    );
    const bidsList = orderBy(
      Object.values(groupedBids).map(mapOrderbookLineToNumber),
      (bid) => bid.price,
      'desc'
    );

    const lowestAsk = asksList.at(-1);
    const highestBid = bidsList.at(0);

    return {
      asks: asksList,
      asksMap: groupedAsks,
      bids: bidsList,
      bidsMap: groupedBids,
      spread: currentMarketOrderbook.spread?.toNumber(),
      spreadPercent: currentMarketOrderbook.spreadPercent?.toNumber(),
      midPrice: roundMidPrice(lowestAsk, highestBid, groupingTickSize)?.toNumber(),
    };
  }
);

/** ------ .map Helper Functions ------ */
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
    depth: depth.toNumber(),
    depthCost: depthCost.toNumber(),
  };
}

function priceBNToNumber({ price }: Pick<OrderbookLineBN, 'price'>) {
  return price.toNumber();
}

/** ------ UnCrossing functions ------ */

function uncrossOrderbook(asks: RawOrderbookLineBN[], bids: RawOrderbookLineBN[]) {
  if (asks.length === 0 || bids.length === 0) {
    return { asks, bids };
  }

  const asksCopy = [...asks];
  const bidsCopy = [...bids];

  let lowestAsk = asksCopy.at(0);
  let highestBid = bidsCopy.at(0);

  while (lowestAsk && highestBid && isCrossed(lowestAsk, highestBid)) {
    if (lowestAsk.offset === highestBid.offset) {
      // If offsets are the same, give precedence to the larger size. In this case,
      // one of the sizes "should" be zero, but we simply check for the larger size.
      if (lowestAsk.size.gte(highestBid.size)) {
        // remove the bid
        bidsCopy.shift();
        highestBid = bidsCopy.at(0);
      } else {
        // remove the ask
        asksCopy.shift();
        lowestAsk = asksCopy.at(0);
      }
    } else {
      // If offsets are different, remove the older offset.
      if (lowestAsk.offset < highestBid.offset) {
        // remove the ask
        asksCopy.shift();
        lowestAsk = asksCopy.at(0);
      } else {
        // remove the bid
        bidsCopy.shift();
        highestBid = bidsCopy.at(0);
      }
    }
  }

  return { asks: asksCopy, bids: bidsCopy };
}

function isCrossed(ask: RawOrderbookLineBN, bid: RawOrderbookLineBN) {
  return ask.price.lte(bid.price);
}

/** ------ Depth and DepthCost Calculation ------ */

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

/** ------ Grouping Helpers ------ */

const getGroupingTickSize = (tickSize: string, multiplier: GroupingMultiplier) => {
  return MustBigNumber(tickSize).times(multiplier).toNumber();
};

/**
 *
 * @param orderbook
 * @param groupingTickSize
 * @param shouldFloor we want to round asks up and bids down so they don't have an overlapping group in the middle
 * @returns Grouped OrderbookLines in a dictionary using price as key
 */
const group = (orderbook: OrderbookLineBN[], groupingTickSize: number, shouldFloor?: boolean) => {
  if (orderbook.length === 0) {
    return null;
  }

  const mapResult: Record<string, OrderbookLineBN> = {};

  orderbook.forEach((line) => {
    const price = roundToNearestFactor({
      number: line.price,
      factor: groupingTickSize,
      roundingMode: shouldFloor ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP,
    });

    const key = price.toString();
    const existingLine = mapResult[key];

    if (existingLine) {
      existingLine.size = existingLine.size.plus(line.size);
      existingLine.sizeCost = existingLine.sizeCost.plus(line.sizeCost);
      existingLine.depth = line.depth;
      existingLine.depthCost = line.depthCost;
    } else {
      mapResult[key] = {
        ...line,
        price,
      };
    }
  });

  return mapResult;
};

function roundMidPrice(
  lowestAsk: OrderbookLine | undefined,
  highestBid: OrderbookLine | undefined,
  groupingTickSize: number
) {
  if (!lowestAsk || !highestBid) {
    return undefined;
  }

  const roundedMidPrice = roundToNearestFactor({
    number: MustBigNumber(lowestAsk.price).plus(highestBid.price).div(2),
    factor: groupingTickSize,
    roundingMode: BigNumber.ROUND_HALF_UP,
  });

  // Reduce precision if midPrice is equal to lowestAsk or highestBid
  return roundedMidPrice.eq(lowestAsk.price) || roundedMidPrice.eq(highestBid.price)
    ? roundToNearestFactor({
        number: MustBigNumber(lowestAsk.price).plus(highestBid.price).div(2),
        factor: groupingTickSize / 10,
        roundingMode: BigNumber.ROUND_HALF_UP,
      })
    : roundedMidPrice;
}
