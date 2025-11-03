import { useMemo } from 'react';

import { MARKET_SYMBOL_MAP } from '@/constants/chartConfig';
import { DEFAULT_MARKETID } from '@/constants/markets';

import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';

import { useAppSelector } from '@/state/appTypes';
import { getAppTheme } from '@/state/appUiConfigsSelectors';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';

import { BaseTvChartWidget } from './BaseTvChartWidget';

export const TvChartWidget = () => {
  const currentMarketId: string = useAppSelector(getCurrentMarketId) ?? DEFAULT_MARKETID;
  const isSimpleUi = useSimpleUiEnabled();
  const appTheme = useAppSelector(getAppTheme);

  // Convert market ID to TradingView symbol format
  const tradingViewSymbol = useMemo(() => {
    return MARKET_SYMBOL_MAP[currentMarketId] || currentMarketId;
  }, [currentMarketId]);

  // Map app theme to TradingView theme
  const widgetTheme = useMemo(() => {
    switch (appTheme) {
      case 'Light':
        return 'light';
      case 'Dark':
        return 'dark';
      default:
        return 'dark';
    }
  }, [appTheme]);

  return (
    <BaseTvChartWidget symbol={tradingViewSymbol} isSimpleUi={isSimpleUi} theme={widgetTheme} />
  );
};
