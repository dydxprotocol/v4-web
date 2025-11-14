import { StatsigFlags } from '@/constants/statsig';

import { testFlags } from '@/lib/testFlags';

import { useStatsigGateValue } from './useStatsig';

export const useEnableSpot = () => {
  const forcedSpot = testFlags.spot;
  const spotFF = useStatsigGateValue(StatsigFlags.ffSpot);

  return forcedSpot || spotFF;
};
