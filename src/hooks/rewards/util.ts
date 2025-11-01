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

// Move to Chaos Labs query once its available
export const OCT_2025_REWARDS_DETAILS = {
  season: 8,
  rewardAmount: '$1M',
  rewardAmountUsd: 1_000_000,
  rebatePercent: '50%',
  rebatePercentNumeric: '50',
  rebateFraction: 0.5,
  endTime: '2025-11-30T23:59:59.000Z', // end of month
};

export const NOV_2025_COMPETITION_DETAILS = {
  rewardAmount: '$250k',
  rewardAmountUsd: 250_000,
  endTime: '2025-11-30T23:59:59.000Z', // end of month
};
