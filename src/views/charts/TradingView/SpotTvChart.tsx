import { useState } from 'react';

import type { TvWidget } from '@/constants/tvchart';

import { useSpotChartMarketAndResolution } from '@/hooks/tradingView/useSpotChartMarketAndResolution';
import { useSpotTradingView } from '@/hooks/tradingView/useSpotTradingView';
import { useTradingViewTheme } from '@/hooks/tradingView/useTradingViewTheme';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';

import { BaseTvChart } from './BaseTvChart';

export interface SpotTvChartProps {
  tokenMint: string;
}

export const SpotTvChart = ({ tokenMint }: SpotTvChartProps) => {
  const [tvWidget, setTvWidget] = useState<TvWidget>();
  const isSimpleUi = useSimpleUiEnabled();

  useSpotTradingView({
    setTvWidget,
    tokenMint,
  });

  useSpotChartMarketAndResolution({
    tokenMint,
    tvWidget,
  });

  useTradingViewTheme({ tvWidget });

  return <BaseTvChart tvWidget={tvWidget} isSimpleUi={isSimpleUi} />;
};
