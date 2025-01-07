import { Loadable, loadableIdle } from '@/abacus-ts/lib/loadable';
// eslint-disable-next-line no-restricted-imports
import {
  AssetInfos,
  MarketsData,
  OrderbookData,
  OrdersData,
  ParentSubaccountData,
} from '@/abacus-ts/rawTypes';
import {
  IndexerHistoricalBlockTradingRewardsResponse,
  IndexerHistoricalFundingResponse,
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
    assets: Loadable<AssetInfos>;
    orderbooks: { [marketId: string]: Loadable<OrderbookData> };
    funding: { [marketId: string]: Loadable<IndexerHistoricalFundingResponse> };
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
  markets: { allMarkets: loadableIdle(), assets: loadableIdle(), orderbooks: {}, funding: {} },
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
    setAllAssetsRaw: (state, action: PayloadAction<Loadable<AssetInfos>>) => {
      state.markets.assets = action.payload;
    },
    setFundingRaw: (
      state,
      action: PayloadAction<{
        marketId: string;
        data: Loadable<IndexerHistoricalFundingResponse>;
      }>
    ) => {
      state.markets.funding[action.payload.marketId] = action.payload.data;
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
  setFundingRaw,
  setOrderbookRaw,
  setAllMarketsRaw,
  setAllAssetsRaw,
  setParentSubaccountRaw,
  setAccountFillsRaw,
  setAccountOrdersRaw,
  setAccountTransfersRaw,
  setAccountBlockTradingRewardsRaw,
  setNetworkStateRaw,
  setIndexerHeightRaw,
  setValidatorHeightRaw,
} = rawSlice.actions;
