import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import './TradingViewWidget.css';

interface TradingViewWidgetProps {
  symbol: string;
  width?: string | number;
  height?: string | number;
  interval?: string;
  timezone?: string;
  theme?: 'light' | 'dark';
  style?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  container_id?: string;
  show_popup_button?: boolean;
  popup_width?: string | number;
  popup_height?: string | number;
  popup_min_width?: string | number;
  popup_min_height?: string | number;
  hide_top_toolbar?: boolean;
  hide_legend?: boolean;
  save_image?: boolean;
  backgroundColor?: string;
  gridColor?: string;
  width_scale?: number;
  height_scale?: number;
  hide_volume?: boolean;
  hide_side_toolbar?: boolean;
  studies_overrides?: Record<string, any>;
  disabled_features?: string[];
  enabled_features?: string[];
  overrides?: Record<string, any>;
  loading_screen?: Record<string, any>;
  favorites?: Record<string, any>;
  charts_storage_url?: string;
  client_id?: string;
  user_id?: string;
  fullscreen?: boolean;
  autosize?: boolean;
  studies?: string[];
  support_host?: string;
  custom_css_url?: string;
  widgetType?: 'chart' | 'ticker' | 'ticker_tape' | 'screener' | 'mini_chart';
  onChartReady?: () => void;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol,
  width = '100%',
  height = '400',
  interval = 'D',
  timezone = 'Etc/UTC',
  theme = 'dark',
  style = '1',
  locale = 'en',
  toolbar_bg = '#f1f3f6',
  enable_publishing = false,
  allow_symbol_change = true,
  container_id = 'tradingview_widget',
  show_popup_button = true,
  popup_width = '1000',
  popup_height = '650',
  popup_min_width = '1000',
  popup_min_height = '650',
  hide_top_toolbar = true,
  hide_legend = false,
  save_image = true,
  backgroundColor = '#131722',
  gridColor = '#363c4e',
  width_scale = 1,
  height_scale = 1,
  hide_volume = false,
  hide_side_toolbar = false,
  studies_overrides = {},
  disabled_features = [],
  enabled_features = [],
  overrides = {},
  loading_screen = {},
  favorites = {},
  charts_storage_url = 'https://saveload.tradingview.com',
  client_id = 'tradingview.com',
  user_id = 'public_user_id',
  fullscreen = false,
  autosize = true,
  studies = [],
  support_host = 'https://www.tradingview.com',
  custom_css_url = '',
  widgetType = 'chart',
  onChartReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && containerRef.current) {


        const widget = new window.TradingView.widget({
          symbol,
          width,
          height,
          interval,
          timezone,
          theme,
          style,
          locale,
          toolbar_bg,
          enable_publishing,
          allow_symbol_change,
          container_id,
          show_popup_button,
          popup_width,
          popup_height,
          popup_min_width,
          popup_min_height,
          hide_top_toolbar,
          hide_legend,
          save_image,
          backgroundColor,
          gridColor,
          width_scale,
          height_scale,
          hide_volume,
          hide_side_toolbar,
          studies_overrides,
          disabled_features,
          enabled_features,
          overrides,
          loading_screen,
          favorites,
          charts_storage_url,
          client_id,
          user_id,
          fullscreen,
          autosize,
          studies,
          support_host,
          custom_css_url,
          widgetType,
        });

        // Call onChartReady callback when widget is ready
        if (onChartReady) {
          widget.onChartReady(() => {
            onChartReady();
          });
        }
      }
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [
    symbol,
    width,
    height,
    interval,
    timezone,
    theme,
    style,
    locale,
    toolbar_bg,
    enable_publishing,
    allow_symbol_change,
    container_id,
    show_popup_button,
    popup_width,
    popup_height,
    popup_min_width,
    popup_min_height,
    hide_top_toolbar,
    hide_legend,
    save_image,
    backgroundColor,
    gridColor,
    width_scale,
    height_scale,
    hide_volume,
    hide_side_toolbar,
    studies_overrides,
    disabled_features,
    enabled_features,
    overrides,
    loading_screen,
    favorites,
    charts_storage_url,
    client_id,
    user_id,
    fullscreen,
    autosize,
    studies,
    support_host,
    custom_css_url,
    widgetType,
  ]);

  return (
    <WidgetContainer>
      <div id={container_id} ref={containerRef} />
    </WidgetContainer>
  );
};

const WidgetContainer = styled.div`
  width: 100%;
  height: 100%;
  
  #tradingview_widget {
    width: 100%;
    height: 100%;
  }
`;

export default TradingViewWidget;
