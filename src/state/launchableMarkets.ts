import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { MetadataServiceCandleResolutions } from '@/constants/assetMetadata';
import { Candle, RESOLUTION_MAP } from '@/constants/candles';

interface CandleDataByMarket {
  data: Record<string, Candle[]>;
  selectedResolution: MetadataServiceCandleResolutions;
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
        candles: Candle[];
        marketId: string;
        resolution: MetadataServiceCandleResolutions;
      }>
    ) => {
      const { candles, marketId, resolution } = action.payload;

      const candleState = state.candles[marketId]
        ? { ...state.candles[marketId], selectedResolution: resolution }
        : {
            data: Object.fromEntries(
              Object.keys(RESOLUTION_MAP).map((resolutionString: string) => [resolutionString, []])
            ),
            selectedResolution: resolution,
          };

      const existingCandles = (candleState.data[resolution] ??= []);

      candleState.data[resolution] = [
        ...existingCandles,
        ...(existingCandles.length
          ? candles.filter(
              ({ startedAt }) => startedAt < existingCandles[existingCandles.length - 1].startedAt
            )
          : candles),
      ];

      state.candles[marketId] = candleState;
    },
  },
});

export const { setLaunchableMarketCandles } = launchableMarketsSlice.actions;
