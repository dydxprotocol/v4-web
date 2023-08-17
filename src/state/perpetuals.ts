import merge from 'lodash/merge';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
  MarketOrderbook,
  MarketTrade,
  Nullable,
  PerpetualMarket,
  MarketHistoricalFunding,
} from '@/constants/abacus';

import { Candle, RESOLUTION_MAP } from '@/constants/candles';

interface CandleDataByMarket {
  data: Record<string, Candle[]>;
  selectedResolution: string;
}

export interface PerpetualsState {
  candles: Record<string, CandleDataByMarket>;
  liveTrades?: Record<string, MarketTrade[]>;
  markets?: Record<string, PerpetualMarket>;
  orderbooks?: Record<string, MarketOrderbook>;
  historicalFundings: Record<string, MarketHistoricalFunding[]>;
}

const initialState: PerpetualsState = {
  candles: {},
  liveTrades: {},
  markets: undefined,
  orderbooks: undefined,
  historicalFundings: {},
};

const MAX_NUM_LIVE_TRADES = 100;

export const perpetualsSlice = createSlice({
  name: 'Perpetuals',
  initialState,
  reducers: {
    setCandles: (
      state: PerpetualsState,
      action: PayloadAction<{ candles: Candle[]; marketId: string; resolution: string }>
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
    setLiveTrades: (
      state: PerpetualsState,
      action: PayloadAction<{ trades: MarketTrade[]; marketId: string }>
    ) => ({
      ...state,
      liveTrades: merge({}, state.liveTrades, {
        [action.payload.marketId]: action.payload.trades.slice(0, MAX_NUM_LIVE_TRADES),
      }),
    }),
    setMarkets: (
      state: PerpetualsState,
      action: PayloadAction<{ markets: Record<string, PerpetualMarket>; update?: boolean }>
    ) => ({
      ...state,
      markets: action.payload.update
        ? merge({}, state.markets, action.payload.markets)
        : action.payload.markets,
    }),
    setOrderbook: (
      state: PerpetualsState,
      action: PayloadAction<{ orderbook?: Nullable<MarketOrderbook>; marketId: string }>
    ) => ({
      ...state,
      orderbooks: merge({}, state.orderbooks, {
        [action.payload.marketId]: action.payload.orderbook,
      }),
    }),
    setTvChartResolution: (
      state: PerpetualsState,
      action: PayloadAction<{ marketId: string; resolution: string }>
    ) => {
      const { marketId, resolution } = action.payload;

      const candleState = state.candles[marketId]
        ? { ...state.candles[marketId], selectedResolution: resolution }
        : {
            data: Object.fromEntries(
              Object.keys(RESOLUTION_MAP).map((resolutionString: string) => [resolutionString, []])
            ),
            selectedResolution: resolution,
          };

      state.candles[marketId] = candleState;
    },
    setHistoricalFundings: (
      state: PerpetualsState,
      action: PayloadAction<{ historicalFundings: MarketHistoricalFunding[]; marketId: string }>
    ) => {
      state.historicalFundings[action.payload.marketId] = action.payload.historicalFundings;
    },
    resetPerpetualsState: () => initialState,
  },
});

export const {
  setCandles,
  setLiveTrades,
  setMarkets,
  setOrderbook,
  setTvChartResolution,
  setHistoricalFundings,
  resetPerpetualsState,
} = perpetualsSlice.actions;
