import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { MetadataServiceCandlesResponse } from '@/constants/assetMetadata';
import { LAUNCHABLE_MARKETS_RESOLUTION_MAP, TradingViewBar } from '@/constants/candles';

import { objectKeys } from '@/lib/objectHelpers';
import { mapCandles2 } from '@/lib/tradingView/utils';

interface CandleDataByMarket {
  data: Record<string, TradingViewBar[]>;
  selectedResolution: string;
}

export interface LaunchableMarketsState {
  candles: Record<string, CandleDataByMarket>;
}

const initialState: LaunchableMarketsState = {
  candles: {},
};

export const launchableMarketsSlice = createSlice({
  name: 'LaunchableMarkets',
  initialState,
  reducers: {
    setLaunchableMarketCandles: (
      state: LaunchableMarketsState,
      action: PayloadAction<{
        candles: MetadataServiceCandlesResponse[string];
        marketId: string;
        resolution: string;
      }>
    ) => {
      const { candles, marketId, resolution } = action.payload;

      const candleState = state.candles[marketId]
        ? { ...state.candles[marketId], selectedResolution: resolution }
        : {
            data: Object.fromEntries(
              Object.keys(LAUNCHABLE_MARKETS_RESOLUTION_MAP).map((resolutionString: string) => [
                resolutionString,
                [],
              ])
            ),
            selectedResolution: resolution,
          };

      const existingCandles = (candleState.data[resolution] ??= []);

      candleState.data[resolution] = [
        ...existingCandles,
        ...(existingCandles.length
          ? candles
              .filter(({ time }) => {
                const timestamp = new Date(time);
                const existingTimestamp = new Date(
                  existingCandles[existingCandles.length - 1].time
                );
                return timestamp < existingTimestamp;
              })
              .map(mapCandles2)
          : candles.map(mapCandles2)),
      ];

      state.candles[marketId] = candleState;
    },
    setLaunchableTvChartResolution: (
      state: LaunchableMarketsState,
      action: PayloadAction<{ marketId: string; resolution: string }>
    ) => {
      const { marketId, resolution } = action.payload;

      const candleState = state.candles[marketId]
        ? { ...state.candles[marketId], selectedResolution: resolution }
        : {
            data: Object.fromEntries(
              objectKeys(LAUNCHABLE_MARKETS_RESOLUTION_MAP).map((resolutionString) => [
                resolutionString,
                [],
              ])
            ),
            selectedResolution: resolution,
          };

      state.candles[marketId] = candleState;
    },
  },
});

export const { setLaunchableMarketCandles, setLaunchableTvChartResolution } =
  launchableMarketsSlice.actions;