import { useMemo } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual } from 'react-redux';

import { OrderbookLine, type PerpetualMarketOrderbookLevel } from '@/constants/abacus';
import { DepthChartDatum, DepthChartSeries } from '@/constants/charts';

import { getSubaccountOrderSizeBySideAndOrderbookLevel } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketOrderbook } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { safeAssign } from '@/lib/objectHelpers';
import { orEmptyRecord } from '@/lib/typeUtils';

export const useCalculateOrderbookData = ({ maxRowsPerSide }: { maxRowsPerSide: number }) => {
  const orderbook = useAppSelector(getCurrentMarketOrderbook, shallowEqual);

  const subaccountOrderSizeBySideAndPrice = orEmptyRecord(
    useAppSelector(getSubaccountOrderSizeBySideAndOrderbookLevel, shallowEqual)
  );

  return useMemo(() => {
    const asks: Array<PerpetualMarketOrderbookLevel | undefined> = (
      orderbook?.asks?.toArray() ?? []
    )
      .map(
        (row: OrderbookLine, idx: number): PerpetualMarketOrderbookLevel =>
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
      .slice(0, maxRowsPerSide);

    const bids: Array<PerpetualMarketOrderbookLevel | undefined> = (
      orderbook?.bids?.toArray() ?? []
    )
      .map(
        (row: OrderbookLine, idx: number): PerpetualMarketOrderbookLevel =>
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
      .slice(0, maxRowsPerSide);

    const spread = orderbook?.spread;
    const spreadPercent = orderbook?.spreadPercent;

    const histogramRange = Math.max(
      Number.isNaN(Number(bids[bids.length - 1]?.depth)) ? 0 : Number(bids[bids.length - 1]?.depth),
      Number.isNaN(Number(asks[asks.length - 1]?.depth)) ? 0 : Number(asks[asks.length - 1]?.depth)
    );

    return {
      asks,
      bids,
      spread,
      spreadPercent,
      histogramRange,
      hasOrderbook: !!orderbook,
      currentGrouping: orderbook?.grouping,
    };
  }, [maxRowsPerSide, orderbook, subaccountOrderSizeBySideAndPrice]);
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
