import { Loadable, loadableIdle } from '@/abacus-ts/loadable';
import { MarketsData, ParentSubaccountData } from '@/abacus-ts/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RawDataState {
  markets: {
    allMarkets: Loadable<MarketsData>;
  };
  account: {
    parentSubaccount: Loadable<ParentSubaccountData>;
  };
}

const initialState: RawDataState = {
  markets: { allMarkets: loadableIdle() },
  account: {
    parentSubaccount: loadableIdle(),
  },
};

export const rawSlice = createSlice({
  name: 'Raw data',
  initialState,
  reducers: {
    setAllMarketsRaw: (state, action: PayloadAction<Loadable<MarketsData>>) => {
      state.markets.allMarkets = action.payload;
    },
    setParentSubaccountRaw: (state, action: PayloadAction<Loadable<ParentSubaccountData>>) => {
      state.account.parentSubaccount = action.payload;
    },
  },
});

export const { setAllMarketsRaw, setParentSubaccountRaw } = rawSlice.actions;
