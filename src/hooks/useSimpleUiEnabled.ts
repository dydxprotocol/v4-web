import { CustomFlags } from '@/constants/statsig';

import { useBreakpoints } from '@/hooks/useBreakpoints';

import { useCustomFlagValue } from './useStatsig';

export const useSimpleUiEnabled = () => {
  const { isTablet } = useBreakpoints();
  const abSimpleUi = useCustomFlagValue(CustomFlags.abSimpleUi);
  const isSimpleUi = abSimpleUi && isTablet;

  return isSimpleUi;
};
