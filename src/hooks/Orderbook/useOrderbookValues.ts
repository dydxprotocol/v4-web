import { useMemo } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual } from 'react-redux';

import { OrderbookLine, type PerpetualMarketOrderbookLevel } from '@/constants/abacus';
import { DepthChartDatum, DepthChartSeries } from '@/constants/charts';

import { getSubaccountOrderSizeBySideAndPrice } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketOrderbook } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';

export const useCalculateOrderbookData = ({ maxRowsPerSide }: { maxRowsPerSide: number }) => {
  const orderbook = useAppSelector(getCurrentMarketOrderbook, shallowEqual);

  const subaccountOrderSizeBySideAndPrice =
    useAppSelector(getSubaccountOrderSizeBySideAndPrice, shallowEqual) || {};

  return useMemo(() => {
    const asks: Array<PerpetualMarketOrderbookLevel | undefined> = (
      orderbook?.asks?.toArray() ?? []
    )
      .map(
        (row: OrderbookLine, idx: number) =>
          ({
            key: `ask-${idx}`,
            side: 'ask',
            mine: subaccountOrderSizeBySideAndPrice[OrderSide.SELL]?.[row.price],
            ...row,
          } as PerpetualMarketOrderbookLevel)
      )
      .slice(0, maxRowsPerSide);

    const bids: Array<PerpetualMarketOrderbookLevel | undefined> = (
      orderbook?.bids?.toArray() ?? []
    )
      .map(
        (row: OrderbookLine, idx: number) =>
          ({
            key: `bid-${idx}`,
            side: 'bid',
            mine: subaccountOrderSizeBySideAndPrice[OrderSide.BUY]?.[row.price],
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
    };
  }, [orderbook, subaccountOrderSizeBySideAndPrice]);
};

export const useOrderbookValuesForDepthChart = () => {
  const orderbook = useAppSelector(getCurrentMarketOrderbook, shallowEqual);

  return useMemo(() => {
    const bids = (orderbook?.bids?.toArray() ?? [])
      .filter(Boolean)
      .map((datum) => ({ ...datum, seriesKey: DepthChartSeries.Bids } as DepthChartDatum));

    const asks = (orderbook?.asks?.toArray() ?? [])
      .filter(Boolean)
      .map((datum) => ({ ...datum, seriesKey: DepthChartSeries.Asks } as DepthChartDatum));

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
