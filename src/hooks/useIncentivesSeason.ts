import {
  getSeasonRewardDistributionNumber,
  IncentivesDistributedNotificationIds,
} from '@/constants/notifications';
import { StatSigFlags } from '@/constants/statsig';

import { useStatsigGateValue } from './useStatsig';

export const useIncentivesSeason = () => {
  // Add an env flag or statsig flag here for easy development + release of reward distribution notifications
  // Example: https://github.com/dydxprotocol/v4-web/pull/809
  const showS6 = useStatsigGateValue(StatSigFlags.ffIncentivesS6RewardsDistributed);
  const incentivesDistributedSeasonId = showS6
    ? IncentivesDistributedNotificationIds.IncentivesDistributedS6
    : IncentivesDistributedNotificationIds.IncentivesDistributedS5;

  const rewardDistributionSeasonNumber = getSeasonRewardDistributionNumber(
    incentivesDistributedSeasonId
  );

  return {
    incentivesDistributedSeasonId,
    rewardDistributionSeasonNumber,
  };
};
