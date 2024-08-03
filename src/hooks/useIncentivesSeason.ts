import {
  getSeasonRewardDistributionNumber,
  IncentivesDistributedNotificationIds,
} from '@/constants/notifications';

import { useEnvFeatures } from '@/hooks/useEnvFeatures';

export const useIncentivesSeason = () => {
  const { seasonFiveIncentivesDistributed } = useEnvFeatures();

  const incentivesDistributedSeasonId = seasonFiveIncentivesDistributed
    ? IncentivesDistributedNotificationIds.IncentivesDistributedS5
    : IncentivesDistributedNotificationIds.IncentivesDistributedS4;

  const rewardDistributionSeasonNumber = getSeasonRewardDistributionNumber(
    incentivesDistributedSeasonId
  );

  return {
    incentivesDistributedSeasonId,
    rewardDistributionSeasonNumber,
  };
};
