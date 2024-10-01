import { RootState } from './_store';

/**
 * @returns saved chartConfig for TradingView
 */
export const getTvChartConfig = (state: RootState, isViewingLaunchableMarket?: boolean) =>
  isViewingLaunchableMarket
    ? state.tradingView.launchableMarketsChartConfig
    : state.tradingView.chartConfig;
