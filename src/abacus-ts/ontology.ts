import { type RootState } from '@/state/_store';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { useCurrentMarketHistoricalFunding } from './rest/funding';
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
  selectUnopenedIsolatedPositions,
} from './selectors/account';
import {
  createSelectParentSubaccountSummaryDeposit,
  createSelectParentSubaccountSummaryWithdrawal,
} from './selectors/accountActions';
import {
  selectApiState,
  selectLatestIndexerHeight,
  selectLatestValidatorHeight,
} from './selectors/apiStatus';
import { createSelectAssetInfo } from './selectors/assets';
import {
  selectRawIndexerHeightDataLoading,
  selectRawValidatorHeightDataLoading,
} from './selectors/base';
import {
  selectAllMarketSummaries,
  selectAllMarketSummariesLoading,
  selectCurrentMarketInfo,
  selectCurrentMarketInfoStable,
} from './selectors/summary';
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
      data: selectAllMarketSummaries,
      loading: selectAllMarketSummariesLoading,
    },
  },
  network: {
    indexerHeight: {
      data: selectLatestIndexerHeight,
      loading: selectRawIndexerHeightDataLoading,
    },
    validatorHeight: {
      data: selectLatestValidatorHeight,
      loading: selectRawValidatorHeightDataLoading,
    },
    apiState: selectApiState,
  },
} as const satisfies NestedSelectors;

export const BonsaiHelpers = {
  currentMarket: {
    marketInfo: selectCurrentMarketInfo,
    // marketInfo but with only the properties that rarely change, for fewer rerenders
    stableMarketInfo: selectCurrentMarketInfoStable,
    account: {
      openOrders: selectCurrentMarketOpenOrders,
      orderHistory: selectCurrentMarketOrderHistory,
      fills: getCurrentMarketAccountFills,
    },
  },
  assets: {
    createSelectAssetInfo,
  },
  forms: {
    deposit: {
      createSelectParentSubaccountSummary: createSelectParentSubaccountSummaryDeposit,
    },
    withdraw: {
      createSelectParentSubaccountSummary: createSelectParentSubaccountSummaryWithdrawal,
    },
  },
  unopenedIsolatedPositions: selectUnopenedIsolatedPositions,
} as const satisfies NestedSelectors;

export const BonsaiHooks = {
  useCurrentMarketHistoricalFunding,
  useCurrentMarketLiveTrades: useCurrentMarketTradesValue,
} as const;
