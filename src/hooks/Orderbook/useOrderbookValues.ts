import { useCallback, useMemo, useState } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { OrderbookLine } from '@/bonsai/types/summaryTypes';
import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual } from 'react-redux';

import { DepthChartDatum, DepthChartSeries } from '@/constants/charts';
import { GROUPING_MULTIPLIER_LIST, GroupingMultiplier } from '@/constants/orderbook';

import { getSubaccountOrderSizeBySideAndOrderbookLevel } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketOrderbook } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { safeAssign } from '@/lib/objectHelpers';
import { orEmptyRecord } from '@/lib/typeUtils';

import { useParameterizedSelector } from '../useParameterizedSelector';

export type OrderbookLineWithMine = OrderbookLine & {
  mine?: number;
  key: string;
  side: 'ask' | 'bid';
};

export const useCalculateOrderbookData = ({ rowsPerSide }: { rowsPerSide: number }) => {
  // const orderbook = useAppSelector(getCurrentMarketOrderbook, shallowEqual);
  const [groupingMultiplier, setGroupingMultiplier] = useState(GroupingMultiplier.ONE);

  const subaccountOrderSizeBySideAndPrice = orEmptyRecord(
    useAppSelector(getSubaccountOrderSizeBySideAndOrderbookLevel, shallowEqual)
  );

  const orderbook = useParameterizedSelector(
    BonsaiHelpers.currentMarket.orderbook.createSelectGroupedData,
    groupingMultiplier
  );

  const modifyGroupingMultiplier = useCallback((shouldIncrease: boolean) => {
    setGroupingMultiplier((prev) => {
      const currIdx = GROUPING_MULTIPLIER_LIST.indexOf(prev);
      if (currIdx === -1) return prev;
      const canIncrease = prev !== GroupingMultiplier.THOUSAND;
      const canDecrease = prev !== GroupingMultiplier.ONE;
      if (shouldIncrease && canIncrease) {
        return GROUPING_MULTIPLIER_LIST[currIdx + 1]!;
      }

      if (!shouldIncrease && canDecrease) {
        return GROUPING_MULTIPLIER_LIST[currIdx - 1]!;
      }

      return prev;
    });
  }, []);

  return useMemo(() => {
    const asks: Array<OrderbookLineWithMine | undefined> = (orderbook?.asks ?? [])
      .map(
        (row: OrderbookLine, idx: number): OrderbookLineWithMine =>
          safeAssign(
            {},
            {
              key: `ask-${idx}`,
              side: 'ask' as const,
              mine: subaccountOrderSizeBySideAndPrice[OrderSide.SELL]?.[row.price],
            },
            row
          )
      )
      .slice(-1 * rowsPerSide);

    const bids: Array<OrderbookLineWithMine | undefined> = (orderbook?.bids ?? [])
      .map(
        (row: OrderbookLine, idx: number): OrderbookLineWithMine =>
          safeAssign(
            {},
            {
              key: `bid-${idx}`,
              side: 'bid' as const,
              mine: subaccountOrderSizeBySideAndPrice[OrderSide.BUY]?.[row.price],
            },
            row
          )
      )
      .slice(0, rowsPerSide);

    const spread = orderbook?.spread;
    const spreadPercent = orderbook?.spreadPercent;

    const histogramRange = Math.max(
      Number.isNaN(Number(bids[bids.length - 1]?.depth)) ? 0 : Number(bids[bids.length - 1]?.depth),
      Number.isNaN(Number(asks[asks.length - 1]?.depth)) ? 0 : Number(asks[asks.length - 1]?.depth)
    );

    return {
      asks,
      bids,
      midMarketPrice: orderbook?.midPrice,
      spread,
      spreadPercent,
      histogramRange,
      hasOrderbook: !!orderbook,

      // Orderbook grouping
      groupingMultiplier,
      modifyGroupingMultiplier,
    };
  }, [
    rowsPerSide,
    orderbook,
    subaccountOrderSizeBySideAndPrice,
    groupingMultiplier,
    modifyGroupingMultiplier,
  ]);
};

export const useOrderbookValuesForDepthChart = () => {
  const orderbook = useAppSelector(getCurrentMarketOrderbook, shallowEqual);

  return useMemo(() => {
    const bids = (orderbook?.bids?.toArray() ?? [])
      .filter(Boolean)
      .map((datum): DepthChartDatum => safeAssign({}, datum, { seriesKey: DepthChartSeries.Bids }));

    const asks = (orderbook?.asks?.toArray() ?? [])
      .filter(Boolean)
      .map((datum): DepthChartDatum => safeAssign({}, datum, { seriesKey: DepthChartSeries.Asks }));

    const lowestBid = bids[bids.length - 1];
    const highestBid = bids[0];
    const lowestAsk = asks[0];
    const highestAsk = asks[asks.length - 1];

    const midMarketPrice = orderbook?.midPrice;
    const spread = MustBigNumber(lowestAsk?.price ?? 0).minus(highestBid?.price ?? 0);
    const spreadPercent = orderbook?.spreadPercent;

    return {
      bids,
      asks,
      lowestBid,
      highestBid,
      lowestAsk,
      highestAsk,
      midMarketPrice,
      spread,
      spreadPercent,
      orderbook,
    };
  }, [orderbook]);
};
