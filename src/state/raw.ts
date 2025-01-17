import { Loadable, loadableIdle } from '@/abacus-ts/lib/loadable';
// eslint-disable-next-line no-restricted-imports
import {
  AssetInfos,
  MarketsData,
  OrderbookData,
  OrdersData,
  ParentSubaccountData,
} from '@/abacus-ts/types/rawTypes';
import { AccountStats, ConfigTiers, UserFeeTier } from '@/abacus-ts/types/summaryTypes';
import { Coin } from '@cosmjs/proto-signing';
import { HeightResponse } from '@dydxprotocol/v4-client-js';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DydxNetwork } from '@/constants/networks';
import {
  IndexerHistoricalBlockTradingRewardsResponse,
  IndexerParentSubaccountTransferResponse,
} from '@/types/indexer/indexerApiGen';
import {
  IndexerCompositeFillResponse,
  IndexerSparklineResponseObject,
} from '@/types/indexer/indexerManual';

interface NetworkState {
  indexerClientReady: boolean;
  compositeClientReady: boolean;
}

export interface RawDataState {
  markets: {
    allMarkets: Loadable<MarketsData>;
    assets: Loadable<AssetInfos>;
    orderbooks: { [marketId: string]: Loadable<OrderbookData> };
    sparklines: Loadable<{
      [period: string]: IndexerSparklineResponseObject | undefined;
    }>;
  };
  account: {
    balances: Loadable<Coin[]>;
    stats: Loadable<AccountStats | undefined>;
    feeTier: Loadable<UserFeeTier | undefined>;
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
  configs: Loadable<ConfigTiers>;
}

const initialState: RawDataState = {
  markets: {
    allMarkets: loadableIdle(),
    assets: loadableIdle(),
    orderbooks: {},
    sparklines: loadableIdle(),
  },
  account: {
    parentSubaccount: loadableIdle(),
    balances: loadableIdle(),
    stats: loadableIdle(),
    feeTier: loadableIdle(),
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
  configs: loadableIdle(),
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
    setOrderbookRaw: (
      state,
      action: PayloadAction<{ marketId: string; data: Loadable<OrderbookData> }>
    ) => {
      state.markets.orderbooks[action.payload.marketId] = action.payload.data;
    },
    setSparklines: (
      state,
      action: PayloadAction<
        Loadable<{
          [period: string]: IndexerSparklineResponseObject | undefined;
        }>
      >
    ) => {
      state.markets.sparklines = action.payload;
    },
    setParentSubaccountRaw: (state, action: PayloadAction<Loadable<ParentSubaccountData>>) => {
      state.account.parentSubaccount = action.payload;
    },
    setAccountBalancesRaw: (state, action: PayloadAction<Loadable<Coin[]>>) => {
      state.account.balances = action.payload;
    },
    setAccountStatsRaw: (state, action: PayloadAction<Loadable<AccountStats | undefined>>) => {
      state.account.stats = action.payload;
    },
    setAccountFeeTierRaw: (state, action: PayloadAction<Loadable<UserFeeTier | undefined>>) => {
      state.account.feeTier = action.payload;
    },
    setConfigTiers: (state, action: PayloadAction<Loadable<ConfigTiers>>) => {
      state.configs = action.payload;
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
  setAllAssetsRaw,
  setSparklines,
  setParentSubaccountRaw,
  setAccountBalancesRaw,
  setAccountStatsRaw,
  setAccountFillsRaw,
  setAccountOrdersRaw,
  setAccountTransfersRaw,
  setAccountBlockTradingRewardsRaw,
  setNetworkStateRaw,
  setIndexerHeightRaw,
  setValidatorHeightRaw,
  setAccountFeeTierRaw,
  setConfigTiers,
} = rawSlice.actions;
