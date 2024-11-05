import { useState } from 'react';

import { ResolutionString } from 'public/tradingview/charting_library';

import type { TvWidget } from '@/constants/tvchart';

import { useChartMarketAndResolution } from '@/hooks/tradingView/useChartMarketAndResolution';
import { useTradingViewLaunchable } from '@/hooks/tradingView/useTradingViewLaunchable';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';

import { BaseTvChart } from './BaseTvChart';

export const TvChartLaunchable = ({ marketId }: { marketId: string }) => {
  const [tvWidget, setTvWidget] = useState<TvWidget>();

  const { savedResolution } = useTradingViewLaunchable({
    marketId,
    tvWidget,
    setTvWidget,
  });

  useChartMarketAndResolution({
    currentMarketId: marketId,
    isViewingUnlaunchedMarket: true,
    tvWidget,
    savedResolution: savedResolution as ResolutionString,
  });

  useTradingViewTheme({
    tvWidget,
  });

  return <BaseTvChart tvWidget={tvWidget} />;
};
