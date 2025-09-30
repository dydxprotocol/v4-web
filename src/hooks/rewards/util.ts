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
export const SEPT_2025_REWARDS_DETAILS = {
  season: 6,
  rewardAmount: '$1M',
  rewardAmountUsd: 1_000_000,
  rebatePercent: '50%',
  rebateFraction: 0.5,
  endTime: '2025-09-30T23:59:59.000Z', // end of sept
};
