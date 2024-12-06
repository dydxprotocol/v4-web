import { Loadable, loadableIdle } from '@/abacus-ts/loadable';
import { MarketsData, ParentSubaccountData } from '@/abacus-ts/types';
import {
  IndexerCompositeFillResponse,
  IndexerCompositeOrderObject,
} from '@/types/indexer/indexerManual';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RawDataState {
  markets: {
    allMarkets: Loadable<MarketsData>;
  };
  account: {
    parentSubaccount: Loadable<ParentSubaccountData>;
    fills: Loadable<IndexerCompositeFillResponse>;
    orders: Loadable<{ [id: string]: IndexerCompositeOrderObject }>;
  };
}

const initialState: RawDataState = {
  markets: { allMarkets: loadableIdle() },
  account: {
    parentSubaccount: loadableIdle(),
    fills: loadableIdle(),
    orders: loadableIdle(),
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
    setAccountFillsRaw: (state, action: PayloadAction<Loadable<IndexerCompositeFillResponse>>) => {
      state.account.fills = action.payload;
    },
    setAccountOrdersRaw: (
      state,
      action: PayloadAction<Loadable<{ [id: string]: IndexerCompositeOrderObject }>>
    ) => {
      state.account.orders = action.payload;
    },
  },
});

export const { setAllMarketsRaw, setParentSubaccountRaw, setAccountFillsRaw, setAccountOrdersRaw } =
  rawSlice.actions;
