import { type RootState } from '@/state/_store';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import {
  getCurrentMarketAccountFills,
  selectAccountFills,
  selectAccountFillsLoading,
  selectAccountOrdersLoading,
  selectCurrentMarketOpenOrders,
  selectCurrentMarketOrderHistory,
  selectOpenOrders,
  selectOrderHistory,
  selectParentSubaccountOpenPositions,
  selectParentSubaccountOpenPositionsLoading,
  selectParentSubaccountSummary,
  selectParentSubaccountSummaryLoading,
} from './selectors/account';
import {
  selectAllAssetsInfo,
  selectAllAssetsInfoLoading,
  selectCurrentMarketAssetInfo,
} from './selectors/assets';
import {
  selectRawIndexerHeightData,
  selectRawIndexerHeightDataLoading,
  selectRawValidatorHeightData,
  selectRawValidatorHeightDataLoading,
} from './selectors/base';
import {
  selectAllMarketsInfo,
  selectAllMarketsInfoLoading,
  selectCurrentMarketInfo,
} from './selectors/markets';
import { useCurrentMarketTradesValue } from './websocket/trades';

// every leaf is a selector or a paramaterized selector
type NestedSelectors = {
  [K: string]:
    | NestedSelectors
    | ((state: RootState) => any)
    | (() => (state: RootState, ...other: any[]) => any);
};

// all data should be accessed via selectors in this file
// no files outside abacus-ts should access anything within abacus-ts except this file
export const BonsaiCore = {
  account: {
    parentSubaccountSummary: {
      data: selectParentSubaccountSummary,
      loading: selectParentSubaccountSummaryLoading,
    },
    parentSubaccountPositions: {
      data: selectParentSubaccountOpenPositions,
      loading: selectParentSubaccountOpenPositionsLoading,
    },
    openOrders: {
      data: selectOpenOrders,
      loading: selectAccountOrdersLoading,
    },
    orderHistory: {
      data: selectOrderHistory,
      loading: selectAccountOrdersLoading,
    },
    fills: {
      data: selectAccountFills,
      loading: selectAccountFillsLoading,
    },
  },
  markets: {
    currentMarketId: getCurrentMarketId,
    markets: {
      data: selectAllMarketsInfo,
      loading: selectAllMarketsInfoLoading,
    },
    assets: { data: selectAllAssetsInfo, loading: selectAllAssetsInfoLoading },
  },
  network: {
    indexerHeight: {
      data: selectRawIndexerHeightData,
      loading: selectRawIndexerHeightDataLoading,
    },
    validatorHeight: {
      data: selectRawValidatorHeightData,
      loading: selectRawValidatorHeightDataLoading,
    },
  },
} as const satisfies NestedSelectors;

export const BonsaiHelpers = {
  currentMarket: {
    marketInfo: selectCurrentMarketInfo,
    assetInfo: selectCurrentMarketAssetInfo,
    account: {
      openOrders: selectCurrentMarketOpenOrders,
      orderHistory: selectCurrentMarketOrderHistory,
      fills: getCurrentMarketAccountFills,
    },
  },
} as const satisfies NestedSelectors;

export const BonsaiHooks = {
  useCurrentMarketLiveTrades: useCurrentMarketTradesValue,
} as const;
