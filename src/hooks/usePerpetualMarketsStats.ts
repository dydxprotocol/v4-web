import { useMemo } from 'react';

import { getChainRevenue } from '@/services';
import { ResolutionString } from 'public/tradingview/charting_library';
import { useQueries, useQuery } from 'react-query';
import { shallowEqual, useSelector } from 'react-redux';

import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { log } from '@/lib/telemetry';

import { useDydxClient } from './useDydxClient';

const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 1);

export const usePerpetualMarketsStats = () => {
  const perpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) ?? {};
  const { getCandles, compositeClient } = useDydxClient();

  const markets = useMemo(
    () => Object.values(perpetualMarkets).filter(Boolean),
    [perpetualMarkets]
  );

  const { data } = useQuery({
    queryKey: ['chain-revenue', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => {
      try {
        return getChainRevenue({
          startDate,
          endDate,
        });
      } catch (error) {
        log('usePerpetualMarketsStats getChainRevenue', error);
      }
    },
    refetchOnWindowFocus: false,
  });

  const results = useQueries(
    markets.map((market) => ({
      enabled: !!compositeClient && markets.length > 0,
      queryKey: ['perpetualMarketCandles', market.id, '1HOUR'],
      queryFn: () => {
        try {
          return getCandles({
            marketId: market.id,
            resolution: '60' as ResolutionString,
            limit: 24,
          });
        } catch (error) {
          log('usePerpetualMarketsStats getCandles', error);
        }
      },
      refetchOnWindowFocus: false,
    }))
  );

  const feeEarned = useMemo(() => data?.[0].total, [data]);

  const stats = useMemo(() => {
    let volume24HUSDC = 0;
    let openInterestUSDC = 0;

    for (const { oraclePrice, perpetual } of markets) {
      const { volume24H, openInterest = 0 } = perpetual || {};
      volume24HUSDC += volume24H ?? 0;
      if (oraclePrice) openInterestUSDC += openInterest * oraclePrice;
    }

    return {
      volume24HUSDC,
      openInterestUSDC,
      feeEarned,
    };
  }, [markets, feeEarned]);

  const feeEarnedChart = useMemo(
    () =>
      data?.map((point, x) => ({
        x: x + 1,
        y: point.total,
      })) ?? [],
    [data]
  );

  const volume24HUSDCChart = useMemo(() => {
    const data = results.map((result) => result.data);

    if (data && data[0]) {
      const sum: number[] = data[0].map((_, columnIndex) =>
        data.reduce((acc, row) => acc + parseFloat(row?.[columnIndex].usdVolume ?? '0'), 0)
      );

      const candles = sum.map((y, x) => ({ x: x + 1, y }));

      return candles;
    }

    return [];
  }, [results]);

  const openInterestUSDCChart = useMemo(() => {
    const data = results.map((result) => result.data);

    if (data && data[0]) {
      const sum: number[] = data[0].map((_, columnIndex) =>
        data.reduce(
          (acc, row) => acc + parseFloat(row?.[columnIndex].startingOpenInterest ?? '0'),
          0
        )
      );

      const candles = sum.map((y, x) => ({ x: x + 1, y }));

      return candles;
    }

    return [];
  }, [results]);

  return {
    stats,
    feeEarnedChart,
    volume24HUSDCChart,
    openInterestUSDCChart,
  };
};
