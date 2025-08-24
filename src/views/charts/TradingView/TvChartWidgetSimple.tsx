import { ResolutionString } from 'public/tradingview/charting_library';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { DEFAULT_WIDGET_SETTINGS, MARKET_SYMBOL_MAP, RESOLUTION_TO_WIDGET_INTERVAL } from '@/constants/chartConfig';
import { DEFAULT_MARKETID } from '@/constants/markets';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';

import { useAppSelector } from '@/state/appTypes';
import { getAppTheme } from '@/state/appUiConfigsSelectors';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';

import TradingViewWidget from '@/components/TradingViewWidget/TradingViewWidget';
import { ResolutionSelector } from './ResolutionSelector';

import { layoutMixins } from '@/styles/layoutMixins';

export const TvChartWidgetSimple = () => {
  const currentMarketId: string = useAppSelector(getCurrentMarketId) ?? DEFAULT_MARKETID;
  const isSimpleUi = useSimpleUiEnabled();
  const appTheme = useAppSelector(getAppTheme);
  const [currentResolution, setCurrentResolution] = useState<ResolutionString>('1D' as ResolutionString);

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
  
  // Ensure we're using the dark theme for proper candle visibility
  const effectiveTheme = widgetTheme === 'dark' ? 'dark' : 'light';

  // Map resolution to widget interval
  const widgetInterval = useMemo(() => {
    return RESOLUTION_TO_WIDGET_INTERVAL[currentResolution] || '1D';
  }, [currentResolution]);
  


  const onResolutionChange = useCallback((resolution: ResolutionString) => {
    setCurrentResolution(resolution);
  }, []);

  if (isSimpleUi) {
    return (
      <div tw="flexColumn h-full">
        <$ChartContainer>
          <TradingViewWidget
            symbol={tradingViewSymbol}
            theme={effectiveTheme}
            interval={widgetInterval}
            width="100%"
            height="100%"
            {...DEFAULT_WIDGET_SETTINGS}
            backgroundColor={widgetTheme === 'dark' ? '#000000' : '#ffffff'}
            gridColor={widgetTheme === 'dark' ? '#363c4e' : '#e1e3e6'}
            toolbar_bg={widgetTheme === 'dark' ? '#2a2e39' : '#f8f9fa'}
          />
        </$ChartContainer>
        
        <ResolutionSelector
          isLaunchable={false}
          onResolutionChange={onResolutionChange}
          currentResolution={currentResolution}
        />
      </div>
    );
  }

  return (
    <$ChartContainer>
            <TradingViewWidget
        symbol={tradingViewSymbol}
        theme={effectiveTheme}
        interval={widgetInterval}
        width="100%"
        height="100%"
        {...DEFAULT_WIDGET_SETTINGS}
        backgroundColor={widgetTheme === 'dark' ? '#000000' : '#ffffff'}
        gridColor={widgetTheme === 'dark' ? '#363c4e' : '#e1e3e6'}
        toolbar_bg={widgetTheme === 'dark' ? '#2a2e39' : '#f8f9fa'}
      />
    </$ChartContainer>
  );
};

const $ChartContainer = styled.div`
  ${layoutMixins.stack}
  user-select: none;
  height: 100%;
  width: 100%;
  
  /* Match the original chart styling */
  > div {
    height: 100%;
    width: 100%;
  }
  
  /* Remove any default margins/padding that might cause gaps */
  iframe {
    border: none;
    margin: 0;
    padding: 0;
  }
  
  /* Ensure TradingView widget fills container completely */
  .tradingview-widget-container {
    height: 100% !important;
    width: 100% !important;
  }
  
  /* Remove any default TradingView margins */
  .tradingview-widget-container > div {
    margin: 0 !important;
    padding: 0 !important;
  }
`;
