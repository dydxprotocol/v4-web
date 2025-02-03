import BigNumber from 'bignumber.js';
import { orderBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { SMALL_USD_DECIMALS } from '@/constants/numbers';
import { GroupingMultiplier } from '@/constants/orderbook';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { isTruthy } from '@/lib/isTruthy';
import { BIG_NUMBERS, MustBigNumber, roundToNearestFactor } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';
import { orEmptyObj, orEmptyRecord } from '@/lib/typeUtils';

import { OrderbookLine, SubaccountOpenOrderPriceMap } from '../types/orderbookTypes';
import { OrderbookData } from '../types/rawTypes';
import { SubaccountOrder } from '../types/summaryTypes';

type OrderbookLineBN = {
  price: BigNumber;
  size: BigNumber;
  sizeCost: BigNumber;
  offset: number;
  depth: BigNumber;
  depthCost: BigNumber;
};

type RawOrderbookLineBN = Omit<OrderbookLineBN, 'depth' | 'depthCost'>;

export type OrderbookProcessingOptions = {
  groupingMultiplier?: GroupingMultiplier;
  asksSortOrder?: 'asc' | 'desc';
  bidsSortOrder?: 'asc' | 'desc';
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
  const spreadPercentBN = spreadBN && midPriceBN && spreadBN.div(midPriceBN);

  return {
    bids: processedBids, // descending bids
    asks: processedAsks, // ascending asks
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
    tickSize: string,
    options?: OrderbookProcessingOptions
  ) => {
    if (currentMarketOrderbook == null) {
      return undefined;
    }

    const {
      groupingMultiplier = GroupingMultiplier.ONE,
      asksSortOrder = 'desc',
      bidsSortOrder = 'desc',
    } = orEmptyObj(options);

    // If groupingMultiplier is ONE, return the orderbook as is.
    if (groupingMultiplier === GroupingMultiplier.ONE) {
      const asks = (
        asksSortOrder === 'desc'
          ? [...currentMarketOrderbook.asks].reverse()
          : currentMarketOrderbook.asks
      ).map(mapOrderbookLineToNumber);

      const bids = (
        bidsSortOrder === 'desc'
          ? currentMarketOrderbook.bids
          : [...currentMarketOrderbook.bids].reverse()
      ).map(mapOrderbookLineToNumber);

      return {
        asks,
        bids,
        spread: currentMarketOrderbook.spread?.toNumber(),
        spreadPercent: currentMarketOrderbook.spreadPercent?.toNumber(),
        midPrice: currentMarketOrderbook.midPrice?.toNumber(),
      };
    }

    const { groupingTickSize, groupingTickSizeDecimals } = getGroupingTickSize(
      tickSize,
      groupingMultiplier
    );

    const { asks, bids } = currentMarketOrderbook;

    const groupedAsks = orEmptyRecord(group(asks, groupingTickSize, groupingTickSizeDecimals));
    const groupedBids = orEmptyRecord(
      group(bids, groupingTickSize, groupingTickSizeDecimals, true)
    );

    // Convert groupedAsks and groupedBids to list and sort by price depending on options. Default is descending.
    const asksList = orderBy(
      Object.values(groupedAsks).map(mapOrderbookLineToNumber),
      [(ask) => ask.price],
      [asksSortOrder]
    );
    const bidsList = orderBy(
      Object.values(groupedBids).map(mapOrderbookLineToNumber),
      (bid) => bid.price,
      [bidsSortOrder]
    );

    const lowestAsk = asksList.at(asksSortOrder === 'desc' ? -1 : 0);
    const highestBid = bidsList.at(bidsSortOrder === 'desc' ? 0 : -1);

    return {
      asks: asksList,
      bids: bidsList,
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

export function getGroupingTickSize(tickSize: string, multiplier: GroupingMultiplier) {
  const groupingTickSize = MustBigNumber(tickSize).times(multiplier).toNumber();

  return {
    groupingTickSize,
    groupingTickSizeDecimals: MustBigNumber(groupingTickSize).dp() ?? SMALL_USD_DECIMALS,
  };
}

/**
 *
 * @param orderbook
 * @param groupingTickSize
 * @param shouldFloor we want to round asks up and bids down so they don't have an overlapping group in the middle
 * @returns Grouped OrderbookLines in a dictionary using price as key
 */
const group = (
  orderbook: OrderbookLineBN[],
  groupingTickSize: number,
  groupingTickSizeDecimals: number,
  shouldFloor?: boolean
) => {
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

    const key = price.toFixed(groupingTickSizeDecimals);
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

/** ------ Orderbook + Open Order Helpers ------ */

export function getSubaccountOpenOrdersPriceMap(
  subaccountOpenOrders: SubaccountOrder[],
  groupingTickSize: number,
  groupingTickSizeDecimals: number
) {
  return subaccountOpenOrders.reduce(
    (acc, order) => {
      const side = order.side;

      const key = roundToNearestFactor({
        number: MustBigNumber(order.price),
        factor: groupingTickSize,
        roundingMode: side === IndexerOrderSide.BUY ? BigNumber.ROUND_FLOOR : BigNumber.ROUND_CEIL,
      }).toFixed(groupingTickSizeDecimals);

      if (acc[side][key]) {
        acc[side][key] = acc[side][key].plus(order.size);
      } else {
        acc[side][key] = order.size;
      }
      return acc;
    },
    {
      [IndexerOrderSide.BUY]: {},
      [IndexerOrderSide.SELL]: {},
    } as SubaccountOpenOrderPriceMap
  );
}

export function findMine({
  orderMap,
  side,
  price,
  groupingTickSize,
  groupingTickSizeDecimals,
}: {
  orderMap: SubaccountOpenOrderPriceMap;
  side: IndexerOrderSide;
  price: number;
  groupingTickSize: number;
  groupingTickSizeDecimals: number;
}): number | undefined {
  const key = roundToNearestFactor({
    number: MustBigNumber(price),
    factor: groupingTickSize,
    roundingMode: side === IndexerOrderSide.BUY ? BigNumber.ROUND_FLOOR : BigNumber.ROUND_CEIL,
  }).toFixed(groupingTickSizeDecimals);

  return orderMap[side][key]?.toNumber();
}
