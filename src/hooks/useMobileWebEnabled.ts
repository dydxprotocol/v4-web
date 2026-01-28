import { StatsigFlags } from '@/constants/statsig';

import { testFlags } from '@/lib/testFlags';

import { useStatsigGateValue } from './useStatsig';

// Flag for determining whether we show the new mobile web or not. Disables simpleui if enabled
export const useMobileWebEnabled = () => {
  const forceMobileWeb = testFlags.enableMobileWeb;
  const mobileWebbFF = useStatsigGateValue(StatsigFlags.ffMobileWeb);

  return forceMobileWeb || mobileWebbFF;
};
