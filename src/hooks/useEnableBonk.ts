// import { isDev } from '@/constants/networks';
import { StatsigFlags } from '@/constants/statsig';

import { useStatsigGateValue } from './useStatsig';

export const useEnableBonkPnlLeaderboard = () => {
  const bonkPnlLeaderboardFF = useStatsigGateValue(StatsigFlags.ffBonkPnlLeaderboard);
  return bonkPnlLeaderboardFF;
};
