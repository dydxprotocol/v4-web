import { RootState } from './_store';

/**
 * @returns saved chartConfig for TradingView
 */
export const getTvChartConfig = (state: RootState) => state.tradingView.chartConfig;
