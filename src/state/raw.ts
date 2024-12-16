import { Loadable, loadableIdle } from '@/abacus-ts/lib/loadable';
import { MarketsData, OrderbookData, OrdersData, ParentSubaccountData } from '@/abacus-ts/rawTypes';
import {
  IndexerHistoricalBlockTradingRewardsResponse,
  IndexerParentSubaccountTransferResponse,
} from '@/types/indexer/indexerApiGen';
import { IndexerCompositeFillResponse } from '@/types/indexer/indexerManual';
import { HeightResponse } from '@dydxprotocol/v4-client-js';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DydxNetwork } from '@/constants/networks';

interface NetworkState {
  indexerClientReady: boolean;
  compositeClientReady: boolean;
}

export interface RawDataState {
  markets: {
    allMarkets: Loadable<MarketsData>;
    orderbooks: { [marketId: string]: Loadable<OrderbookData> };
  };
  account: {
    parentSubaccount: Loadable<ParentSubaccountData>;
    fills: Loadable<IndexerCompositeFillResponse>;
    orders: Loadable<OrdersData>;
    transfers: Loadable<IndexerParentSubaccountTransferResponse>;
    blockTradingRewards: Loadable<IndexerHistoricalBlockTradingRewardsResponse>;
  };
  network: {
    [networkId: string]: NetworkState;
  };
  heights: {
    indexerHeight: Loadable<HeightResponse>;
    validatorHeight: Loadable<HeightResponse>;
  };
}

const initialState: RawDataState = {
  markets: { allMarkets: loadableIdle(), orderbooks: {} },
  account: {
    parentSubaccount: loadableIdle(),
    fills: loadableIdle(),
    orders: loadableIdle(),
    transfers: loadableIdle(),
    blockTradingRewards: loadableIdle(),
  },
  network: {},
  heights: {
    indexerHeight: loadableIdle(),
    validatorHeight: loadableIdle(),
  },
};

export const rawSlice = createSlice({
  name: 'Raw data',
  initialState,
  reducers: {
    setAllMarketsRaw: (state, action: PayloadAction<Loadable<MarketsData>>) => {
      state.markets.allMarkets = action.payload;
    },
    setOrderbookRaw: (
      state,
      action: PayloadAction<{ marketId: string; data: Loadable<OrderbookData> }>
    ) => {
      state.markets.orderbooks[action.payload.marketId] = action.payload.data;
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
    setAccountOrdersRaw: (state, action: PayloadAction<Loadable<OrdersData>>) => {
      state.account.orders = action.payload;
    },
    setNetworkStateRaw: (
      state,
      action: PayloadAction<{ networkId: DydxNetwork; stateToMerge: Partial<NetworkState> }>
    ) => {
      const { networkId, stateToMerge } = action.payload;
      state.network[networkId] = {
        ...(state.network[networkId] ?? { compositeClientReady: false, indexerClientReady: false }),
        ...stateToMerge,
      };
    },
    setIndexerHeightRaw: (state, action: PayloadAction<Loadable<HeightResponse>>) => {
      state.heights.indexerHeight = action.payload;
    },
    setValidatorHeightRaw: (state, action: PayloadAction<Loadable<HeightResponse>>) => {
      state.heights.validatorHeight = action.payload;
    },
  },
});

export const {
  setOrderbookRaw,
  setAllMarketsRaw,
  setParentSubaccountRaw,
  setAccountFillsRaw,
  setAccountOrdersRaw,
  setAccountTransfersRaw,
  setAccountBlockTradingRewardsRaw,
  setNetworkStateRaw,
  setIndexerHeightRaw,
  setValidatorHeightRaw,
} = rawSlice.actions;
