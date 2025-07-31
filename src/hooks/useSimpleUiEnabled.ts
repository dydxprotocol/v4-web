import { useBreakpoints } from '@/hooks/useBreakpoints';

import { testFlags } from '@/lib/testFlags';

export const useSimpleUiEnabled = () => {
  const { isTablet } = useBreakpoints();
  const forcedSimpleUiValue = testFlags.simpleUi;
  const isSimpleUi = isTablet ? forcedSimpleUiValue ?? true : false;

  return isSimpleUi;
};
