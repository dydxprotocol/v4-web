export function pointsToEstimatedDydxRewards(
  points?: number,
  totalPoints?: number,
  dydxPrice?: number,
  totalUsdRewards?: number
) {
  if (!totalPoints || !dydxPrice || !totalUsdRewards || points === undefined) return '-';
  const usdRewards = (points / totalPoints) * totalUsdRewards;
  return usdRewards / dydxPrice;
}

export function pointsToEstimatedDollarRewards(
  points?: number,
  totalPoints?: number,
  totalUsdRewards?: number
) {
  if (!totalPoints || !totalUsdRewards || points === undefined) return undefined;
  return (points / totalPoints) * totalUsdRewards;
}

export function feesToEstimatedDollarRewards(totalFees?: number): number {
  if (!totalFees) return 0;
  return totalFees * 0.5;
}

// Move to Chaos Labs query once its available
export const CURRENT_SURGE_REWARDS_DETAILS = {
  season: 9,
  rewardAmount: '',
  rewardAmountUsd: 0,
  rebatePercent: '50%',
  rebatePercentNumeric: '50',
  rebateFraction: 0.5,
  endTime: '2025-12-31T23:59:59.000Z', // end of month
};

export const DEC_2025_COMPETITION_DETAILS = {
  rewardAmount: '$1M',
  rewardAmountUsd: 1_000_000,
  endTime: '2025-12-31T23:59:59.000Z', // end of month
};
