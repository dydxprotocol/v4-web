import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface TradingViewState {
  chartConfig?: object;
  launchableMarketsChartConfig?: object;
}

const initialState: TradingViewState = {
  chartConfig: undefined,
  launchableMarketsChartConfig: undefined,
};

export const tradingViewSlice = createSlice({
  name: 'TradingView',
  initialState,
  reducers: {
    updateChartConfig: (state, action: PayloadAction<object>) => {
      state.chartConfig = action.payload;
    },
    updateLaunchableMarketsChartConfig: (state, action: PayloadAction<object>) => {
      state.launchableMarketsChartConfig = action.payload;
    },
  },
});

export const { updateChartConfig, updateLaunchableMarketsChartConfig } = tradingViewSlice.actions;
