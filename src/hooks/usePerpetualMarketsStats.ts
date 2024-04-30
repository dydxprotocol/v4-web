import { useMemo } from 'react';

import { getChainRevenue } from '@/services';
import { useQuery } from 'react-query';
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

  return {
    stats,
    feeEarnedChart,
  };
};
