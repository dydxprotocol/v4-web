import { useState } from 'react';

import type { TvWidget } from '@/constants/tvchart';

import { useSpotTradingView } from '@/hooks/tradingView/useSpotTradingView';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';

import { BaseTvChart } from './BaseTvChart';

export interface SpotTvChartProps {
  symbol: string;
}

export const SpotTvChart = ({ symbol }: SpotTvChartProps) => {
  const [tvWidget, setTvWidget] = useState<TvWidget>();
  const isSimpleUi = useSimpleUiEnabled();

  useSpotTradingView({
    setTvWidget,
    symbol,
  });

  useTradingViewTheme({ tvWidget });

  return <BaseTvChart tvWidget={tvWidget} isSimpleUi={isSimpleUi} />;
};
