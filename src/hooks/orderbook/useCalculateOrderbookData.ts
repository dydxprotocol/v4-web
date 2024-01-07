import { useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { OrderSide } from '@dydxprotocol/v4-client-js';

import { OrderbookLine } from '@/constants/abacus';

import { getCurrentMarketOrderbook } from '@/state/perpetualsSelectors';
import { getSubaccountOpenOrdersBySideAndPrice } from '@/state/accountSelectors';

import type { RowData } from '@/views/Orderbook/OrderbookRow';

import { MustBigNumber } from '@/lib/numbers';

export const useCalculateOrderbookData = ({ maxRowsPerSide }: { maxRowsPerSide: number }) => {
  const orderbook = useSelector(getCurrentMarketOrderbook, shallowEqual);

  const openOrdersBySideAndPrice =
    useSelector(getSubaccountOpenOrdersBySideAndPrice, shallowEqual) || {};

  return useMemo(() => {
    const asks = (orderbook?.asks?.toArray() ?? [])
      .map(
        (row: OrderbookLine) =>
          ({
            side: 'ask',
            mine: openOrdersBySideAndPrice[OrderSide.SELL]?.[row.price]?.size,
            ...row,
          } as RowData)
      )
      .slice(0, maxRowsPerSide);

    const bids = (orderbook?.bids?.toArray() ?? [])
      .map(
        (row: OrderbookLine) =>
          ({
            side: 'bid',
            mine: openOrdersBySideAndPrice[OrderSide.BUY]?.[row.price]?.size,
            ...row,
          } as RowData)
      )
      .slice(0, maxRowsPerSide);

    const spread =
      asks[0] && bids[0] ? MustBigNumber(asks[0]?.price ?? 0).minus(bids[0]?.price ?? 0) : null;

    const spreadPercent = orderbook?.spreadPercent;

    const histogramRange = Math.max(
      Number(bids[bids.length - 1]?.depth),
      Number(asks[asks.length - 1]?.depth)
    );

    return { asks, bids, spread, spreadPercent, histogramRange, hasOrderbook: !!orderbook };
  }, [orderbook, openOrdersBySideAndPrice]);
};
