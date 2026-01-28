import { isDev } from '@/constants/networks';
import { StatsigFlags } from '@/constants/statsig';

import { CURRENT_BONK_REWARDS_DETAILS } from './rewards/util';
import { useStatsigGateValue } from './useStatsig';

export const useEnableBonkPnlLeaderboard = () => {
  const bonkPnlLeaderboardFF = useStatsigGateValue(StatsigFlags.ffBonkPnlLeaderboard);
  const isLive = new Date() >= new Date(CURRENT_BONK_REWARDS_DETAILS.startTime);
  return isDev || bonkPnlLeaderboardFF || isLive;
};
