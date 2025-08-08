import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

// NOTE: This app slice is persisted via redux-persist. Changes to this type may require migrations.
export interface TradingViewState {
  chartConfig?: object;
  launchableMarketsChartConfig?: object;
  spotChartConfig?: object;
}

const initialState: TradingViewState = {
  chartConfig: undefined,
  launchableMarketsChartConfig: undefined,
  spotChartConfig: undefined,
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
    updateSpotChartConfig: (state, action: PayloadAction<object>) => {
      state.spotChartConfig = action.payload;
    },
  },
});

export const { updateChartConfig, updateLaunchableMarketsChartConfig, updateSpotChartConfig } =
  tradingViewSlice.actions;
