import { useRef } from 'react';

import { ResolutionString } from 'public/tradingview/charting_library';

import type { TvWidget } from '@/constants/tvchart';

import { useChartMarketAndResolution } from '@/hooks/tradingView/useChartMarketAndResolution';
import { useTradingViewLaunchable } from '@/hooks/tradingView/useTradingViewLaunchable';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';

import { BaseTvChart } from './BaseTvChart';

export const TvChartLaunchable = ({ marketId }: { marketId: string }) => {
  const tvWidgetRef = useRef<TvWidget | null>(null);
  const tvWidget = tvWidgetRef.current;

  const { savedResolution } = useTradingViewLaunchable({
    marketId,
    tvWidgetRef,
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
