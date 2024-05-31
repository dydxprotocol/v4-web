import { useMemo } from 'react';

import { getChainRevenue } from '@/services/numia';
import { useQuery } from '@tanstack/react-query';
import { shallowEqual, useSelector } from 'react-redux';

import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { wrapAndLogError } from '@/lib/asyncUtils';
import { isPresent, orEmptyObj } from '@/lib/typeUtils';

const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 1);

export const usePerpetualMarketsStats = () => {
  const perpetualMarkets = orEmptyObj(useSelector(getPerpetualMarkets, shallowEqual));

  const markets = useMemo(
    () => Object.values(perpetualMarkets).filter(isPresent),
    [perpetualMarkets]
  );

  const { data } = useQuery({
    queryKey: ['chain-revenue', startDate.toISOString(), endDate.toISOString()],
    queryFn: wrapAndLogError(
      () =>
        getChainRevenue({
          startDate,
          endDate,
        }),
      'usePerpetualMarketsStats getChainRevenue',
      true
    ),
    refetchOnWindowFocus: false,
    gcTime: 1_000 * 60 * 5, // 5 minutes
    staleTime: 1_000 * 60 * 10, // 10 minutes
  });

  const feesEarned = useMemo(() => {
    if (!data) return null;

    return data.reduce((acc, { total }) => acc + total, 0);
  }, [data]);

  const stats = useMemo(() => {
    let volume24HUSDC = 0;
    let openInterestUSDC = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const { oraclePrice, perpetual } of markets) {
      const { volume24H, openInterest = 0 } = perpetual ?? {};
      volume24HUSDC += volume24H ?? 0;
      if (oraclePrice) openInterestUSDC += openInterest * oraclePrice;
    }

    return {
      volume24HUSDC,
      openInterestUSDC,
      feesEarned,
    };
  }, [markets, feesEarned]);

  const feesEarnedChart = useMemo(
    () =>
      data?.map((point, x) => ({
        x: x + 1,
        y: point.total,
      })) ?? [],
    [data]
  );

  return {
    stats,
    feesEarnedChart,
  };
};
