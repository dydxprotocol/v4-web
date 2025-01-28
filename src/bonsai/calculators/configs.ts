import BigNumber from 'bignumber.js';

import { QUANTUM_MULTIPLIER } from '@/constants/numbers';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';

import {
  EquityTiers,
  EquityTiersSummary,
  EquityTierSummary,
  FeeTiers,
  FeeTierSummary,
} from '../types/summaryTypes';

const QUANTUM_MULTIPLIER_BN = MustBigNumber(QUANTUM_MULTIPLIER);

export function calculateFeeTiers(payload: FeeTiers | undefined): FeeTierSummary[] | undefined {
  return payload?.tiers
    .map((tier) => {
      const volume = MustBigNumber(tier.absoluteVolumeRequirement)
        .div(QUANTUM_MULTIPLIER_BN)
        .integerValue(BigNumber.ROUND_FLOOR)
        .toNumber();

      return {
        id: tier.name,
        tier: tier.name,
        symbol: '≥',
        volume,
        totalShare: MustBigNumber(tier.totalVolumeShareRequirementPpm)
          .div(QUANTUM_MULTIPLIER_BN)
          .toNumber(),
        makerShare: MustBigNumber(tier.makerVolumeShareRequirementPpm)
          .div(QUANTUM_MULTIPLIER_BN)
          .toNumber(),
        maker: MustBigNumber(tier.makerFeePpm).div(QUANTUM_MULTIPLIER_BN).toNumber(),
        taker: MustBigNumber(tier.takerFeePpm).div(QUANTUM_MULTIPLIER_BN).toNumber(),
      };
    })
    .filter(isTruthy);
}

function createEquityTier(
  current: { usdTncRequired: string; limit: number },
  next?: { usdTncRequired: string; limit: number }
): EquityTierSummary | undefined {
  const requiredTotalNetCollateralUSD = MustBigNumber(current.usdTncRequired)
    .div(QUANTUM_MULTIPLIER_BN)
    .toNumber();

  const nextLevelRequiredTotalNetCollateralUSD = next
    ? MustBigNumber(next.usdTncRequired).div(QUANTUM_MULTIPLIER_BN).toNumber()
    : undefined;

  const maxOrders = Math.round(current.limit);

  return {
    requiredTotalNetCollateralUSD,
    nextLevelRequiredTotalNetCollateralUSD,
    maxOrders,
  };
}

export function calculateEquityTiers(
  payload: EquityTiers | undefined
): EquityTiersSummary | undefined {
  if (!payload) return undefined;

  const shortTerms = payload.shortTermOrderEquityTiers;
  const shortTermOrderEquityTiers: EquityTierSummary[] = shortTerms
    .map((cur, index) => createEquityTier(cur, shortTerms[index + 1]))
    .filter(isTruthy);

  const statefuls = payload.statefulOrderEquityTiers;
  const statefulOrderEquityTiers: EquityTierSummary[] = statefuls
    .map((cur, index) => createEquityTier(cur, shortTerms[index + 1]))
    .filter(isTruthy);

  return {
    shortTermOrderEquityTiers,
    statefulOrderEquityTiers,
  };
}
