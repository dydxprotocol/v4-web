import { isDev } from '@/constants/networks';
import { StatsigFlags } from '@/constants/statsig';

import { useStatsigGateValue } from './useStatsig';

export const useEnableSpot = () => {
  const spotFF = useStatsigGateValue(StatsigFlags.ffSpotBonk);
  return isDev || spotFF;
};
