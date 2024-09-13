import {
  getSeasonRewardDistributionNumber,
  IncentivesDistributedNotificationIds,
} from '@/constants/notifications';

export const useIncentivesSeason = () => {
  // Add an env flag or statsig flag here for easy development + release of reward distribution notifications
  // Example: https://github.com/dydxprotocol/v4-web/pull/809

  const incentivesDistributedSeasonId =
    IncentivesDistributedNotificationIds.IncentivesDistributedS6;

  const rewardDistributionSeasonNumber = getSeasonRewardDistributionNumber(
    incentivesDistributedSeasonId
  );

  return {
    incentivesDistributedSeasonId,
    rewardDistributionSeasonNumber,
  };
};
