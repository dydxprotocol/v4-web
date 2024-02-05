import merge from 'lodash/merge';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { IOrderLineAdapter } from 'public/tradingview/charting_library';

import type {
  MarketOrderbook,
  MarketTrade,
  Nullable,
  PerpetualMarket,
  MarketHistoricalFunding,
} from '@/constants/abacus';

import { Candle, RESOLUTION_MAP } from '@/constants/candles';
import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_MARKETID } from '@/constants/markets';

import { getLocalStorage } from '@/lib/localStorage';
import { processOrderbookToCreateMap } from '@/lib/orderbookHelpers';

interface CandleDataByMarket {
  data: Record<string, Candle[]>;
  selectedResolution: string;
}

export interface PerpetualsState {
  currentMarketId?: string;
  candles: Record<string, CandleDataByMarket>;
  liveTrades?: Record<string, MarketTrade[]>;
  markets?: Record<string, PerpetualMarket>;
  orderbooks?: Record<string, MarketOrderbook>;
  orderbooksMap?: Record<
    string,
    {
      asks: Record<string, number>;
      bids: Record<string, number>;
    }
  >;
  historicalFundings: Record<string, MarketHistoricalFunding[]>;
  showOrderLines?: boolean;
  orderLines: Record<string, IOrderLineAdapter>;
}

const initialState: PerpetualsState = {
  currentMarketId: undefined,
  candles: {},
  liveTrades: {},
  markets: undefined,
  orderbooks: undefined,
  orderbooksMap: undefined,
  historicalFundings: {},
  showOrderLines: false,
  orderLines: {},
};

const MAX_NUM_LIVE_TRADES = 100;

export const perpetualsSlice = createSlice({
  name: 'Perpetuals',
  initialState,
  reducers: {
    setCurrentMarketId: (state: PerpetualsState, action: PayloadAction<string>) => {
      state.currentMarketId = action.payload;
    },
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
    ) => {
      state.orderbooks = merge({}, state.orderbooks, {
        [action.payload.marketId]: action.payload.orderbook,
      });

      const { newAsks, newBids } = processOrderbookToCreateMap({
        orderbookMap: state.orderbooksMap?.[action.payload.marketId],
        newOrderbook: action.payload.orderbook,
      });

      state.orderbooksMap = {
        ...(state.orderbooksMap ?? {}),
        [action.payload.marketId]: {
          asks: newAsks,
          bids: newBids,
        },
      };
    },
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
    setShowOrderLines: (
      state: PerpetualsState,
      action: PayloadAction<{ showOrderLines: boolean }>
    ) => ({
      ...state,
      showOrderLines: action.payload.showOrderLines,
    }),
    setOrderLines: (
      state: PerpetualsState,
      action: PayloadAction<{ orderLines: Record<string, IOrderLineAdapter> }>
    ) => ({
      ...state,
      orderLines: action.payload.orderLines,
    }),
    resetPerpetualsState: () =>
      ({
        ...initialState,
        currentMarketId:
          getLocalStorage({ key: LocalStorageKey.LastViewedMarket }) ?? DEFAULT_MARKETID,
      } as PerpetualsState),
  },
});

export const {
  setCurrentMarketId,
  setCandles,
  setLiveTrades,
  setMarkets,
  setOrderbook,
  setTvChartResolution,
  setHistoricalFundings,
  setShowOrderLines,
  setOrderLines,
  resetPerpetualsState,
} = perpetualsSlice.actions;
