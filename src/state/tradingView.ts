import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface TradingViewState {
  chartConfig: object | undefined;
}

const initialState: TradingViewState = {
  chartConfig: undefined,
};

export const tradingViewSlice = createSlice({
  name: 'TradingView',
  initialState,
  reducers: {
    updateChartConfig: (state, action: PayloadAction<object>) => {
      state.chartConfig = action.payload;
    },
  },
});

export const { updateChartConfig } = tradingViewSlice.actions;
