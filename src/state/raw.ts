import { Loadable, loadableIdle } from '@/abacus-ts/loadable';
import { MarketsData } from '@/abacus-ts/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RawDataState {
  markets: {
    allMarkets: Loadable<MarketsData>;
  };
  account: {};
}

const initialState: RawDataState = {
  markets: { allMarkets: loadableIdle() },
  account: {},
};

export const rawSlice = createSlice({
  name: 'Raw data',
  initialState,
  reducers: {
    setAllMarketsRaw: (state: RawDataState, action: PayloadAction<Loadable<MarketsData>>) => ({
      ...state,
      markets: { ...state.markets, allMarkets: action.payload },
    }),
  },
});

export const { setAllMarketsRaw } = rawSlice.actions;
