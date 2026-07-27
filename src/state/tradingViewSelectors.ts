import { RootState } from './_store';

/**
 * @returns saved chartConfig for TradingView
 */
export const getTvChartConfig = (state: RootState, isViewingLaunchableMarket?: boolean) => {
  if (isViewingLaunchableMarket) {
    return state.tradingView.launchableMarketsChartConfig;
  }
  return state.tradingView.chartConfig;
};
