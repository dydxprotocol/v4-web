import { useState } from 'react';

import type { TvWidget } from '@/constants/tvchart';

import { useChartMarketAndResolution } from '@/hooks/tradingView/useChartMarketAndResolution';
import { useTradingViewLaunchable } from '@/hooks/tradingView/useTradingViewLaunchable';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';
import { useBreakpoints } from '@/hooks/useBreakpoints';

import { testFlags } from '@/lib/testFlags';

import { BaseTvChart } from './BaseTvChart';

export const TvChartLaunchable = ({ marketId }: { marketId: string }) => {
  const { isTablet } = useBreakpoints();
  const isSimpleUi = isTablet && testFlags.simpleUi;

  const [tvWidget, setTvWidget] = useState<TvWidget>();

  useTradingViewLaunchable({
    marketId,
    tvWidget,
    setTvWidget,
  });

  useChartMarketAndResolution({
    currentMarketId: marketId,
    isViewingUnlaunchedMarket: true,
    tvWidget,
  });

  useTradingViewTheme({
    tvWidget,
  });

  return <BaseTvChart isLaunchable tvWidget={tvWidget} isSimpleUi={isSimpleUi} />;
};
