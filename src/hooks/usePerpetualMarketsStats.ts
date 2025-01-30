import { useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';

import { useAppSelector } from '@/state/appTypes';

import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';
import { isPresent, orEmptyRecord } from '@/lib/typeUtils';

const FEE_ESTIMATION_MULTIPLIER = 0.0002 * 0.4; // 40% of 2bps because of vault and affiliate revshare

export const usePerpetualMarketsStats = () => {
  const perpetualMarkets = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));

  const markets = useMemo(
    () => Object.values(perpetualMarkets).filter(isPresent),
    [perpetualMarkets]
  );

  const stats = useMemo(() => {
    let volume24HUSDC = BIG_NUMBERS.ZERO;
    let openInterestUSDC = BIG_NUMBERS.ZERO;

    // eslint-disable-next-line no-restricted-syntax
    for (const { oraclePrice, volume24H, openInterest } of markets) {
      volume24HUSDC = volume24HUSDC.plus(volume24H);
      if (oraclePrice) {
        openInterestUSDC = openInterestUSDC.plus(MustBigNumber(openInterest).times(oraclePrice));
      }
    }

    return {
      volume24HUSDC: volume24HUSDC.toNumber(),
      openInterestUSDC: openInterestUSDC.toNumber(),
      feesEarned: volume24HUSDC.times(FEE_ESTIMATION_MULTIPLIER).toNumber(),
    };
  }, [markets]);

  return {
    stats,
  };
};
