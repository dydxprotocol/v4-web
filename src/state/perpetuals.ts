import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import merge from 'lodash/merge';

import type { PerpetualMarket } from '@/constants/abacus';
import { LaunchMarketStatus } from '@/constants/launchableMarkets';
import { LocalStorageKey } from '@/constants/localStorage';
import { DEFAULT_MARKETID, MarketFilters } from '@/constants/markets';

import { getLocalStorage } from '@/lib/localStorage';

export interface PerpetualsState {
  currentMarketId?: string;
  // if user is viewing is a live, tradeable market: its id; otherwise: undefined
  currentMarketIdIfTradeable?: string;
  marketFilter: MarketFilters;
  launchMarketIds: string[];

  markets?: Record<string, PerpetualMarket>;
}

const initialState: PerpetualsState = {
  currentMarketId: undefined,
  currentMarketIdIfTradeable: undefined,
  markets: undefined,
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
    setMarkets: (
      state: PerpetualsState,
      action: PayloadAction<{ markets: Record<string, PerpetualMarket>; update?: boolean }>
    ) => ({
      ...state,
      markets: action.payload.update
        ? merge({}, state.markets, action.payload.markets)
        : action.payload.markets,
    }),
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
  setMarkets,
  resetPerpetualsState,
  setMarketFilter,
  setLaunchMarketIds,
} = perpetualsSlice.actions;
