import { useRef, useState } from 'react';

import { ResolutionString } from 'public/tradingview/charting_library';

import type { TvWidget } from '@/constants/tvchart';

import { useChartMarketAndResolution } from '@/hooks/tradingView/useChartMarketAndResolution';
import { useTradingViewLaunchable } from '@/hooks/tradingView/useTradingViewLaunchable';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';

import { BaseTvChart } from './BaseTvChart';

export const TvChartLaunchable = ({ marketId }: { marketId: string }) => {
  const [isChartReady, setIsChartReady] = useState(false);

  const tvWidgetRef = useRef<TvWidget | null>(null);
  const tvWidget = tvWidgetRef.current;
  const isWidgetReady = tvWidget?._ready;

  const { savedResolution } = useTradingViewLaunchable({
    marketId,
    tvWidgetRef,
    setIsChartReady,
  });

  useChartMarketAndResolution({
    currentMarketId: marketId,
    isViewingUnlaunchedMarket: true,
    tvWidget,
    isWidgetReady,
    savedResolution: savedResolution as ResolutionString,
  });

  useTradingViewTheme({
    tvWidget,
    isWidgetReady,
  });

  return <BaseTvChart isChartReady={isChartReady} />;
};
