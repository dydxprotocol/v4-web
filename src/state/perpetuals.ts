import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import merge from 'lodash/merge';

import type { MarketOrderbook, Nullable } from '@/constants/abacus';
import { LaunchMarketStatus } from '@/constants/launchableMarkets';
import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_MARKETID, MarketFilters } from '@/constants/markets';

import { getLocalStorage } from '@/lib/localStorage';
import { processOrderbookToCreateMap } from '@/lib/orderbookHelpers';

export interface PerpetualsState {
  currentMarketId?: string;
  // if user is viewing is a live, tradeable market: its id; otherwise: undefined
  currentMarketIdIfTradeable?: string;
  marketFilter: MarketFilters;
  launchMarketIds: string[];

  orderbooks?: Record<string, MarketOrderbook>;
  orderbooksMap?: Record<
    string,
    {
      asks: Record<string, number>;
      bids: Record<string, number>;
    }
  >;
}

const initialState: PerpetualsState = {
  currentMarketId: undefined,
  currentMarketIdIfTradeable: undefined,
  orderbooks: undefined,
  orderbooksMap: undefined,
  marketFilter: MarketFilters.ALL,
  launchMarketIds: [],
};

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
    setCurrentMarketIdIfTradeable: (
      state: PerpetualsState,
      action: PayloadAction<string | undefined>
    ) => {
      state.currentMarketIdIfTradeable = action.payload;
    },
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
    resetPerpetualsState: () =>
      ({
        ...initialState,
        currentMarketId:
          getLocalStorage({ key: LocalStorageKey.LastViewedMarket }) ?? DEFAULT_MARKETID,
      }) satisfies PerpetualsState,
    setLaunchMarketIds: (
      state: PerpetualsState,
      action: PayloadAction<{ launchedMarketId: string; launchStatus: LaunchMarketStatus }>
    ) => {
      const { launchedMarketId, launchStatus } = action.payload;
      if (launchStatus === LaunchMarketStatus.PENDING) {
        state.launchMarketIds = [...state.launchMarketIds, launchedMarketId];
      } else {
        state.launchMarketIds = state.launchMarketIds.filter((id) => id !== launchedMarketId);
      }
    },
  },
});

export const {
  setCurrentMarketId,
  setCurrentMarketIdIfTradeable,
  setOrderbook,
  resetPerpetualsState,
  setMarketFilter,
  setLaunchMarketIds,
} = perpetualsSlice.actions;
