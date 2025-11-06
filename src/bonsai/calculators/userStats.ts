import { formatUnits } from 'viem/utils';

import { QUANTUM_MULTIPLIER } from '@/constants/numbers';

import { MustBigNumber } from '@/lib/numbers';

import {
  AccountStats,
  UserFeeTier,
  UserStakingTier,
  UserStakingTierSummary,
  UserStats,
} from '../types/summaryTypes';

export const calculateAccountStakingTier = (
  stakingTier: UserStakingTier | undefined
): UserStakingTierSummary | undefined => {
  if (!stakingTier) {
    return undefined;
  }

  return {
    feeTierName: stakingTier.feeTierName,
    discountPercent: MustBigNumber(stakingTier.discountPpm).div(QUANTUM_MULTIPLIER).toNumber(),
    stakedBaseTokens: formatUnits(BigInt(stakingTier.stakedBaseTokens), 18),
  };
};

export function calculateUserStats(
  feeTier: UserFeeTier | undefined,
  stakingTier: UserStakingTier | undefined,
  accountStats: AccountStats | undefined
): UserStats {
  const state: UserStats = {};

  if (stakingTier) {
    state.stakingTierId = stakingTier.feeTierName;
    state.stakingTierDiscount = stakingTier.discountPpm
      ? MustBigNumber(stakingTier.discountPpm).div(QUANTUM_MULTIPLIER).toNumber()
      : undefined;
  }

  if (feeTier) {
    state.feeTierId = feeTier.name;

    const makerFeeRate = MustBigNumber(feeTier.makerFeePpm).div(QUANTUM_MULTIPLIER).toNumber();
    const takerFeeRate = MustBigNumber(feeTier.takerFeePpm).div(QUANTUM_MULTIPLIER).toNumber();

    // Apply Staking Tier Discount to the base fee rates.
    // Note: Staking tier discounts are applied first to the base fee rates here.
    // Market-specific discounts (if any) are applied later to the final fee amount
    // in the calculateTradeFeeAfterDiscounts function.
    const makerFeeAfterStakingTierDiscount = makerFeeRate * (1 - (state.stakingTierDiscount ?? 0));
    const takerFeeAfterStakingTierDiscount = takerFeeRate * (1 - (state.stakingTierDiscount ?? 0));

    state.makerFeeRate = makerFeeAfterStakingTierDiscount;
    state.takerFeeRate = takerFeeAfterStakingTierDiscount;
  }

  if (accountStats) {
    state.makerVolume30D = MustBigNumber(accountStats.makerNotional)
      .div(QUANTUM_MULTIPLIER)
      .toNumber();
    state.takerVolume30D = MustBigNumber(accountStats.takerNotional)
      .div(QUANTUM_MULTIPLIER)
      .toNumber();
  }

  return state;
}
