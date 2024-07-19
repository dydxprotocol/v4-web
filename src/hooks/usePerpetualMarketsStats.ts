import { useMemo } from 'react';

import { shallowEqual } from 'react-redux';

import { useAppSelector } from '@/state/appTypes';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { isPresent, orEmptyRecord } from '@/lib/typeUtils';

const FEE_ESTIMATION_MULTIPLIER = 0.0002; // 2bps

export const usePerpetualMarketsStats = () => {
  const perpetualMarkets = orEmptyRecord(useAppSelector(getPerpetualMarkets, shallowEqual));

  const markets = useMemo(
    () => Object.values(perpetualMarkets).filter(isPresent),
    [perpetualMarkets]
  );

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
      feesEarned: volume24HUSDC * FEE_ESTIMATION_MULTIPLIER,
    };
  }, [markets]);

  return {
    stats,
  };
};
