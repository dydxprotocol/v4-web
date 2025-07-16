import { CustomFlags } from '@/constants/statsig';

import { useBreakpoints } from '@/hooks/useBreakpoints';

import { testFlags } from '@/lib/testFlags';

import { useCustomFlagValue } from './useStatsig';

export const useSimpleUiEnabled = () => {
  const { isTablet } = useBreakpoints();
  const abSimpleUi = useCustomFlagValue(CustomFlags.abSimpleUi);
  const forcedSimpleUiValue = testFlags.simpleUi;
  const isSimpleUi = isTablet ? forcedSimpleUiValue ?? abSimpleUi : false;

  return isSimpleUi;
};
