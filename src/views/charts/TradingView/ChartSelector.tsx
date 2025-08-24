import React from 'react';

import { USE_WIDGET_CHARTS } from '@/constants/chartConfig';

import { TvChart } from './TvChart';
import { TvChartWidgetSimple } from './TvChartWidgetSimple';

/**
 * ChartSelector component that automatically chooses between:
 * - Original charting library (TvChart) when USE_WIDGET_CHARTS is false
 * - New TradingView widget (TvChartWidgetSimple) when USE_WIDGET_CHARTS is true
 */
export const ChartSelector = () => {
  if (USE_WIDGET_CHARTS) {
    return <TvChartWidgetSimple />;
  }

  return <TvChart />;
};
