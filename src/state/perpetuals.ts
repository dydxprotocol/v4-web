import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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
  abacusHasMarkets: boolean;
}

const initialState: PerpetualsState = {
  currentMarketId: undefined,
  currentMarketIdIfTradeable: undefined,
  marketFilter: MarketFilters.ALL,
  launchMarketIds: [],
  abacusHasMarkets: false,
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
    setAbacusHasMarkets: (state: PerpetualsState, action: PayloadAction<boolean>) => {
      state.abacusHasMarkets = action.payload;
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
  resetPerpetualsState,
  setMarketFilter,
  setLaunchMarketIds,
  setAbacusHasMarkets,
} = perpetualsSlice.actions;
