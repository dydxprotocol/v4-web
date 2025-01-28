import { QUANTUM_MULTIPLIER } from '@/constants/numbers';

import { MustBigNumber } from '@/lib/numbers';

import { AccountStats, UserFeeTier, UserStats } from '../types/summaryTypes';

export function calculateUserStats(
  feeTier: UserFeeTier | undefined,
  accountStats: AccountStats | undefined
): UserStats {
  const state: UserStats = {};

  if (feeTier) {
    state.feeTierId = feeTier.name;
    state.makerFeeRate = MustBigNumber(feeTier.makerFeePpm).div(QUANTUM_MULTIPLIER).toNumber();
    state.takerFeeRate = MustBigNumber(feeTier.takerFeePpm).div(QUANTUM_MULTIPLIER).toNumber();
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
