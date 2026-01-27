import { StatsigFlags } from '@/constants/statsig';

import { testFlags } from '@/lib/testFlags';

import { useStatsigGateValue } from './useStatsig';

export const useMobileWebEnabled = () => {
  const forceMobileWeb = testFlags.enableMobileWeb;
  const mobileWebbFF = useStatsigGateValue(StatsigFlags.ffMobileWeb);

  return forceMobileWeb || mobileWebbFF;
};
