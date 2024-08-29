import { kollections } from '@dydxprotocol/v4-abacus';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import merge from 'lodash/merge';

import type {
  MarketHistoricalFunding,
  MarketOrderbook,
  MarketTrade,
  Nullable,
  PerpetualMarket,
} from '@/constants/abacus';
import { Candle, RESOLUTION_MAP } from '@/constants/candles';
import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_MARKETID, MarketFilters } from '@/constants/markets';

import { getLocalStorage } from '@/lib/localStorage';
import { objectKeys } from '@/lib/objectHelpers';
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
  rawMarkets?: Nullable<kollections.Map<string, PerpetualMarket>>;
  orderbooks?: Record<string, MarketOrderbook>;
  orderbooksMap?: Record<
    string,
    {
      asks: Record<string, number>;
      bids: Record<string, number>;
    }
  >;
  historicalFundings: Record<string, MarketHistoricalFunding[]>;
  marketFilter: MarketFilters;
}

const initialState: PerpetualsState = {
  currentMarketId: undefined,
  candles: {},
  liveTrades: {},
  markets: undefined,
  orderbooks: undefined,
  orderbooksMap: undefined,
  historicalFundings: {},
  marketFilter: MarketFilters.ALL,
};

const MAX_NUM_LIVE_TRADES = 100;

export const perpetualsSlice = createSlice({
  name: 'Perpetuals',
  initialState,
  reducers: {
    setMarketFilter: (state: PerpetualsState, action: PayloadAction<MarketFilters>) => {
      state.marketFilter = action.payload;
    },
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
      action: PayloadAction<{
        markets: Record<string, PerpetualMarket>;
        update?: boolean;
        raw: Nullable<kollections.Map<string, PerpetualMarket>>;
      }>
    ) => ({
      ...state,
      markets: action.payload.update
        ? merge({}, state.markets, action.payload.markets)
        : action.payload.markets,
      rawMarkets: action.payload.raw,
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
              objectKeys(RESOLUTION_MAP).map((resolutionString) => [resolutionString, []])
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
    resetPerpetualsState: () =>
      ({
        ...initialState,
        currentMarketId:
          getLocalStorage({ key: LocalStorageKey.LastViewedMarket }) ?? DEFAULT_MARKETID,
      }) satisfies PerpetualsState,
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
  resetPerpetualsState,
  setMarketFilter,
} = perpetualsSlice.actions;
