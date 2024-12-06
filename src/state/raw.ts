import { Loadable, loadableIdle } from '@/abacus-ts/loadable';
import { MarketsData, ParentSubaccountData } from '@/abacus-ts/types';
import {
  IndexerHistoricalBlockTradingRewardsResponse,
  IndexerParentSubaccountTransferResponse,
} from '@/types/indexer/indexerApiGen';
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
    transfers: Loadable<IndexerParentSubaccountTransferResponse>;
    blockTradingRewards: Loadable<IndexerHistoricalBlockTradingRewardsResponse>;
  };
}

const initialState: RawDataState = {
  markets: { allMarkets: loadableIdle() },
  account: {
    parentSubaccount: loadableIdle(),
    fills: loadableIdle(),
    orders: loadableIdle(),
    transfers: loadableIdle(),
    blockTradingRewards: loadableIdle(),
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
    setAccountTransfersRaw: (
      state,
      action: PayloadAction<Loadable<IndexerParentSubaccountTransferResponse>>
    ) => {
      state.account.transfers = action.payload;
    },
    setAccountBlockTradingRewardsRaw: (
      state,
      action: PayloadAction<Loadable<IndexerHistoricalBlockTradingRewardsResponse>>
    ) => {
      state.account.blockTradingRewards = action.payload;
    },
    setAccountOrdersRaw: (
      state,
      action: PayloadAction<Loadable<{ [id: string]: IndexerCompositeOrderObject }>>
    ) => {
      state.account.orders = action.payload;
    },
  },
});

export const {
  setAllMarketsRaw,
  setParentSubaccountRaw,
  setAccountFillsRaw,
  setAccountOrdersRaw,
  setAccountTransfersRaw,
  setAccountBlockTradingRewardsRaw,
} = rawSlice.actions;
