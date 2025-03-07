import { NOBLE_BECH32_PREFIX } from '@dydxprotocol/v4-client-js';
import { orderBy, pick } from 'lodash';
import { shallowEqual } from 'react-redux';

import { EMPTY_ARR } from '@/constants/objects';
import { IndexerPerpetualPositionStatus } from '@/types/indexer/indexerApiGen';

import { createAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';

import { convertBech32Address } from '@/lib/addressUtils';

import { calculateFills } from '../calculators/fills';
import {
  calculateAllOrders,
  calculateOpenOrders,
  calculateOrderHistory,
} from '../calculators/orders';
import {
  calculateChildSubaccountSummaries,
  calculateMarketsNeededForSubaccount,
  calculateParentSubaccountPositions,
  calculateParentSubaccountSummary,
  calculateUnopenedIsolatedPositions,
} from '../calculators/subaccount';
import { calculateTransfers } from '../calculators/transfers';
import { mergeLoadableStatus } from '../lib/mapLoadable';
import { selectParentSubaccountInfo } from '../socketSelectors';
import { SubaccountTransfer } from '../types/summaryTypes';
import { selectLatestIndexerHeight, selectLatestValidatorHeight } from './apiStatus';
import {
  selectRawFillsLiveData,
  selectRawFillsRest,
  selectRawFillsRestData,
  selectRawIndexerHeightDataLoadable,
  selectRawMarkets,
  selectRawMarketsData,
  selectRawOrdersLiveData,
  selectRawOrdersRest,
  selectRawOrdersRestData,
  selectRawParentSubaccount,
  selectRawParentSubaccountData,
  selectRawTransfersLiveData,
  selectRawTransfersRest,
  selectRawTransfersRestData,
  selectRawValidatorHeightDataLoadable,
} from './base';

const BACKUP_BLOCK_HEIGHT = { height: 0, time: '1971-01-01T00:00:00Z' };

const selectRelevantMarketsList = createAppSelector(
  [selectRawParentSubaccountData],
  (parentSubaccount) => {
    if (parentSubaccount == null) {
      return undefined;
    }
    return calculateMarketsNeededForSubaccount(parentSubaccount);
  }
);

export const selectRelevantMarketsData = createAppSelector(
  [selectRelevantMarketsList, selectRawMarketsData],
  (marketIds, markets) => {
    if (markets == null || marketIds == null) {
      return undefined;
    }
    return pick(markets, ...marketIds);
  },
  {
    // use shallow equal for result so that we only update when these specific keys differ
    memoizeOptions: { resultEqualityCheck: shallowEqual },
  }
);

export const selectParentSubaccountSummary = createAppSelector(
  [selectRawParentSubaccountData, selectRelevantMarketsData],
  (parentSubaccount, markets) => {
    if (parentSubaccount == null || markets == null) {
      return undefined;
    }
    const result = calculateParentSubaccountSummary(parentSubaccount, markets);
    return result;
  }
);

export const selectParentSubaccountPositions = createAppSelector(
  [selectRawParentSubaccountData, selectRelevantMarketsData],
  (parentSubaccount, markets) => {
    if (parentSubaccount == null || markets == null) {
      return undefined;
    }
    return calculateParentSubaccountPositions(parentSubaccount, markets);
  }
);

export const selectParentSubaccountSummaryLoading = createAppSelector(
  [selectRawParentSubaccount, selectRawMarkets],
  mergeLoadableStatus
);

export const selectParentSubaccountOpenPositions = createAppSelector(
  [selectParentSubaccountPositions],
  (positions) => {
    return positions?.filter((p) => p.status === IndexerPerpetualPositionStatus.OPEN);
  }
);

export const selectParentSubaccountOpenPositionsLoading = selectParentSubaccountSummaryLoading;

export const selectAccountOrders = createAppSelector(
  [
    selectRawOrdersRestData,
    selectRawOrdersLiveData,
    selectLatestValidatorHeight,
    selectLatestIndexerHeight,
  ],
  (rest, live, indexerHeight, validatorHeight) => {
    return calculateAllOrders(rest, live, validatorHeight ?? indexerHeight ?? BACKUP_BLOCK_HEIGHT);
  }
);

export const selectOpenOrders = createAppSelector([selectAccountOrders], (orders) => {
  return calculateOpenOrders(orders);
});

export const selectOrderHistory = createAppSelector([selectAccountOrders], (orders) => {
  return calculateOrderHistory(orders);
});

export const selectCurrentMarketOpenOrders = createAppSelector(
  [getCurrentMarketId, selectOpenOrders],
  (currentMarketId, orders) =>
    !currentMarketId ? EMPTY_ARR : orders.filter((o) => o.marketId === currentMarketId)
);

export const selectCurrentMarketOrderHistory = createAppSelector(
  [getCurrentMarketId, selectOrderHistory],
  (currentMarketId, orders) =>
    !currentMarketId ? EMPTY_ARR : orders.filter((o) => o.marketId === currentMarketId)
);

export const selectAccountOrdersLoading = createAppSelector(
  [
    selectRawOrdersRest,
    selectRawParentSubaccount,
    selectRawIndexerHeightDataLoadable,
    selectRawValidatorHeightDataLoadable,
  ],
  mergeLoadableStatus
);

export const selectChildSubaccountSummaries = createAppSelector(
  [selectRawParentSubaccountData, selectRelevantMarketsData],
  (parentSubaccount, marketsData) => {
    if (parentSubaccount == null || marketsData == null) {
      return undefined;
    }

    return calculateChildSubaccountSummaries(parentSubaccount, marketsData);
  }
);

export const selectUnopenedIsolatedPositions = createAppSelector(
  [selectChildSubaccountSummaries, selectOpenOrders, selectParentSubaccountPositions],
  (childSubaccounts, orders, positions) => {
    if (childSubaccounts == null || positions == null) {
      return undefined;
    }

    return calculateUnopenedIsolatedPositions(childSubaccounts, orders, positions);
  }
);

export const selectAccountFills = createAppSelector(
  [selectRawFillsRestData, selectRawFillsLiveData],
  (rest, live) => {
    return calculateFills(rest?.fills, live);
  }
);

export const getCurrentMarketAccountFills = createAppSelector(
  [getCurrentMarketId, selectAccountFills],
  (currentMarketId, fills) =>
    !currentMarketId ? EMPTY_ARR : fills.filter((f) => f.market === currentMarketId)
);

export const selectAccountFillsLoading = createAppSelector(
  [selectRawFillsRest, selectRawParentSubaccount],
  mergeLoadableStatus
);

export const selectAccountTransfers = createAppSelector(
  [selectRawTransfersRestData, selectRawTransfersLiveData, selectParentSubaccountInfo],
  (rest, live, { wallet }): SubaccountTransfer[] => {
    return orderBy(
      Object.values(calculateTransfers(rest?.transfers, live, wallet)).map((o) => ({
        ...o,
        id: o.transactionHash,
      })),
      (o) => o.createdAt,
      'desc'
    );
  }
);

export const selectAccountTransfersLoading = createAppSelector(
  [selectRawTransfersRest, selectRawParentSubaccount],
  mergeLoadableStatus
);

export const selectAccountNobleWalletAddress = createAppSelector(
  [selectParentSubaccountInfo],
  (parentSubaccountInfo) => {
    if (parentSubaccountInfo.wallet == null) {
      return undefined;
    }

    const nobleWalletAddress = convertBech32Address({
      address: parentSubaccountInfo.wallet,
      bech32Prefix: NOBLE_BECH32_PREFIX,
    });

    return nobleWalletAddress;
  }
);
