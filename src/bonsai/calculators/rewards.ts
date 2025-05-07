import { QUANTUM_MULTIPLIER } from '@/constants/numbers';

import { mapIfPresent } from '@/lib/do';
import { AttemptNumber } from '@/lib/numbers';

import { RewardParamsSummary, RewardsParams, TokenPriceResponse } from '../types/summaryTypes';
import { convertAmount } from './balances';

export function calculateRewardsSummary(
  params: RewardsParams | undefined,
  price: TokenPriceResponse | undefined
): RewardParamsSummary {
  const feeMultiplierPpm = params?.feeMultiplierPpm;
  const tokenPrice = price?.price;
  const tokenPriceExponent = price?.exponent;

  return {
    feeMultiplier: mapIfPresent(
      feeMultiplierPpm,
      (feeMultiplier) => feeMultiplier / QUANTUM_MULTIPLIER
    ),
    tokenPrice: mapIfPresent(tokenPrice, tokenPriceExponent, (p, exp) =>
      AttemptNumber(convertAmount(p, exp * -1))
    ),
  };
}
