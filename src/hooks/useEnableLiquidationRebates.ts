import { StatsigFlags } from '@/constants/statsig';

import { useStatsigGateValue } from './useStatsig';

export const useEnableLiquidationRebates = () => {
  const onlyShowLiquidationRebatesFF = useStatsigGateValue(
    StatsigFlags.ffOnlyShowLiquidationRebates
  );
  return onlyShowLiquidationRebatesFF;
};
