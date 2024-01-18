import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { DepthChartSeries, DepthChartDatum } from '@/constants/charts';

import { getCurrentMarketOrderbook } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';

export const useOrderbookValuesForDepthChart = () => {
  const orderbook = useSelector(getCurrentMarketOrderbook, shallowEqual);

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
