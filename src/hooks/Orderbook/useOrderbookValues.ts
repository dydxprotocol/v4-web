import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { OrderSide } from '@dydxprotocol/v4-client-js';

import { type PerpetualMarketOrderbookLevel } from '@/constants/abacus';

import { getCurrentMarketOrderbook } from '@/state/perpetualsSelectors';
import { getSubaccountOpenOrdersBySideAndPrice } from '@/state/accountSelectors';

import { MustBigNumber } from '@/lib/numbers';

export const useCalculateOrderbookData = ({ maxRowsPerSide }: { maxRowsPerSide: number }) => {
  const orderbook = useSelector(getCurrentMarketOrderbook, shallowEqual);

  const openOrdersBySideAndPrice =
    useSelector(getSubaccountOpenOrdersBySideAndPrice, shallowEqual) || {};

  return useMemo(() => {
    const asks: Array<PerpetualMarketOrderbookLevel | undefined> = (
      orderbook?.asks?.toArray() ?? []
    )
      .map(
        (row, idx: number) =>
          ({
            key: `ask-${idx}`,
            side: 'ask',
            mine: openOrdersBySideAndPrice[OrderSide.SELL]?.[row.price]?.size,
            ...row,
          } as PerpetualMarketOrderbookLevel)
      )
      .slice(0, maxRowsPerSide);

    const bids: Array<PerpetualMarketOrderbookLevel | undefined> = (
      orderbook?.bids?.toArray() ?? []
    )
      .map(
        (row, idx: number) =>
          ({
            key: `bid-${idx}`,
            side: 'bid',
            mine: openOrdersBySideAndPrice[OrderSide.BUY]?.[row.price]?.size,
            ...row,
          } as PerpetualMarketOrderbookLevel)
      )
      .slice(0, maxRowsPerSide);

    // Prevent the bid/ask sides from crossing by using the offsets.
    // While the books are crossing...
    while (asks[0] && bids[0] && bids[0]!.price >= asks[0].price) {
      // Drop the order on the side with the lower offset.
      // The offset of the other side is higher and so supercedes.
      if (bids[0]!.offset === asks[0].offset) {
        // If offsets are the same, give precedence to the larger size. In this case,
        // one of the sizes *should* be zero, but we simply check for the larger size.
        if (bids[0]!.size > asks[0].size) {
          asks.shift();
        } else {
          bids.pop();
        }
      } else {
        // Offsets are not equal. Give precedence to the larger offset.
        if (bids[0]!.offset > asks[0].offset) {
          asks.shift();
        } else {
          bids.pop();
        }
      }
    }

    const spread =
      asks[0]?.price && bids[0]?.price ? MustBigNumber(asks[0].price).minus(bids[0].price) : null;

    const spreadPercent = orderbook?.spreadPercent;

    const histogramRange = Math.max(
      isNaN(Number(bids[bids.length - 1]?.depth)) ? 0 : Number(bids[bids.length - 1]?.depth),
      isNaN(Number(asks[asks.length - 1]?.depth)) ? 0 : Number(asks[asks.length - 1]?.depth)
    );

    return {
      asks,
      bids,
      spread,
      spreadPercent,
      histogramRange,
      hasOrderbook: !!orderbook,
    };
  }, [orderbook, openOrdersBySideAndPrice]);
};
