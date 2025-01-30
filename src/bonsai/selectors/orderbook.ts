import { DepthChartSeries } from '@/constants/charts';
import { EMPTY_ARR } from '@/constants/objects';
import { GroupingMultiplier } from '@/constants/orderbook';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { createAppSelector } from '@/state/appTypes';

import { orEmptyObj } from '@/lib/typeUtils';

import {
  calculateOrderbook,
  findMine,
  formatOrderbook,
  getGroupingTickSize,
  getSubaccountOpenOrdersPriceMap,
} from '../calculators/orderbook';
import { CanvasOrderbookLine } from '../types/orderbookTypes';
import { selectCurrentMarketOpenOrders } from './account';
import { selectCurrentMarketOrderbook } from './markets';
import { selectCurrentMarketInfoStable } from './summary';

export const selectCurrentMarketMidPrice = createAppSelector(
  [selectCurrentMarketOrderbook],
  (orderbook) => {
    if (orderbook == null) {
      return undefined;
    }

    return calculateOrderbook(orderbook.data)?.midPrice;
  }
);

export const createSelectCurrentMarketOrderbook = () =>
  createAppSelector(
    [
      selectCurrentMarketOrderbook,
      selectCurrentMarketInfoStable,
      selectCurrentMarketOpenOrders,
      (_s, groupingMultiplier?: GroupingMultiplier) => groupingMultiplier,
    ],
    (orderbook, stableInfo, openOrders, groupingMultiplier) => {
      if (orderbook == null || stableInfo == null) {
        return undefined;
      }

      const orderbookBN = calculateOrderbook(orderbook.data);
      const { groupingTickSize, groupingTickSizeDecimals } = getGroupingTickSize(
        stableInfo.tickSize,
        groupingMultiplier ?? GroupingMultiplier.ONE
      );

      const subaccountOpenOrdersPriceMap = getSubaccountOpenOrdersPriceMap(
        openOrders,
        groupingTickSize,
        groupingTickSizeDecimals
      );

      const formattedOrderbook = formatOrderbook(orderbookBN, stableInfo.tickSize, {
        groupingMultiplier,
        asksSortOrder: 'asc',
      });

      const bids: CanvasOrderbookLine[] =
        formattedOrderbook?.bids.map((line) => ({
          ...line,
          side: 'bid',
          mine: findMine({
            price: line.price,
            side: IndexerOrderSide.BUY,
            orderMap: subaccountOpenOrdersPriceMap,
            groupingTickSize,
            groupingTickSizeDecimals,
          }),
        })) ?? EMPTY_ARR;

      const asks: CanvasOrderbookLine[] =
        formattedOrderbook?.asks.map((line) => ({
          ...line,
          side: 'ask',
          mine: findMine({
            price: line.price,
            side: IndexerOrderSide.SELL,
            orderMap: subaccountOpenOrdersPriceMap,
            groupingTickSize,
            groupingTickSizeDecimals,
          }),
        })) ?? EMPTY_ARR;

      const { midPrice, spread, spreadPercent } = orEmptyObj(formattedOrderbook);

      return {
        bids,
        asks,
        midPrice,
        spread,
        spreadPercent,
        groupingTickSize,
        groupingTickSizeDecimals,
      };
    }
  );

export const selectCurrentMarketDepthChart = createAppSelector(
  [selectCurrentMarketOrderbook, selectCurrentMarketInfoStable],
  (orderbook, stableInfo) => {
    if (orderbook == null || stableInfo == null) {
      return undefined;
    }
    const { tickSize } = stableInfo;
    const calculatedOrderbook = calculateOrderbook(orderbook.data);
    const formattedOrderbook = formatOrderbook(calculatedOrderbook, tickSize, {
      groupingMultiplier: GroupingMultiplier.ONE,
      asksSortOrder: 'asc',
      bidsSortOrder: 'asc',
    });

    const asks =
      formattedOrderbook?.asks.map((datum) => ({
        ...datum,
        seriesKey: DepthChartSeries.Asks,
      })) ?? EMPTY_ARR;
    const bids =
      formattedOrderbook?.bids.map((datum) => ({
        ...datum,
        seriesKey: DepthChartSeries.Bids,
      })) ?? EMPTY_ARR;

    const lowestBid = bids.at(0);
    const highestBid = bids.at(-1);
    const lowestAsk = asks.at(0);
    const highestAsk = asks.at(-1);

    return {
      bids,
      asks,
      lowestBid,
      highestBid,
      lowestAsk,
      highestAsk,
      spread: formattedOrderbook?.spread,
      spreadPercent: formattedOrderbook?.spreadPercent,
      midPrice: formattedOrderbook?.midPrice,
    };
  }
);
