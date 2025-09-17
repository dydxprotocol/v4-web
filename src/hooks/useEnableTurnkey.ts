import { StatsigFlags } from '@/constants/statsig';

import { testFlags } from '@/lib/testFlags';

import { useStatsigGateValue } from './useStatsig';

export const useEnableTurnkey = () => {
  const forcedTurnkey = testFlags.enableTurnkey;
  const turnkeyFF = useStatsigGateValue(StatsigFlags.ffTurnkeyWeb);

  return forcedTurnkey || turnkeyFF;
};
