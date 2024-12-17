import { IndexerPerpetualPositionStatus } from '@/types/indexer/indexerApiGen';
import { pick } from 'lodash';
import { shallowEqual } from 'react-redux';

import { createAppSelector } from '@/state/appTypes';

import { calculateFills } from '../calculators/fills';
import {
  calculateAllOrders,
  calculateOpenOrders,
  calculateOrderHistory,
} from '../calculators/orders';
import {
  calculateMarketsNeededForSubaccount,
  calculateParentSubaccountPositions,
  calculateParentSubaccountSummary,
} from '../calculators/subaccount';
import { calculateTransfers } from '../calculators/transfers';
import { mergeLoadableStatus } from '../lib/mapLoadable';
import {
  selectRawFillsLiveData,
  selectRawFillsRest,
  selectRawFillsRestData,
  selectRawIndexerHeight,
  selectRawIndexerHeightData,
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
  selectRawValidatorHeight,
  selectRawValidatorHeightData,
} from './base';

const selectRelevantMarketsList = createAppSelector(
  [selectRawParentSubaccountData],
  (parentSubaccount) => {
    if (parentSubaccount == null) {
      return undefined;
    }
    return calculateMarketsNeededForSubaccount(parentSubaccount);
  }
);

const selectRelevantMarketsData = createAppSelector(
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

const baseTime = { height: 0, time: '1971-01-01T00:00:00Z' };
export const selectAccountOrders = createAppSelector(
  [
    selectRawOrdersRestData,
    selectRawOrdersLiveData,
    selectRawValidatorHeightData,
    selectRawIndexerHeightData,
  ],
  (rest, live, indexerHeight, validatorHeight) => {
    return calculateAllOrders(rest, live, validatorHeight ?? indexerHeight ?? baseTime);
  }
);

export const selectOpenOrders = createAppSelector([selectAccountOrders], (orders) => {
  return calculateOpenOrders(orders);
});

export const selectOrderHistory = createAppSelector([selectAccountOrders], (orders) => {
  return calculateOrderHistory(orders);
});

export const selectAccountOrdersLoading = createAppSelector(
  [
    selectRawOrdersRest,
    selectRawParentSubaccount,
    selectRawValidatorHeight,
    selectRawIndexerHeight,
  ],
  mergeLoadableStatus
);

export const selectAccountFills = createAppSelector(
  [selectRawFillsRestData, selectRawFillsLiveData],
  (rest, live) => {
    return calculateFills(rest?.fills, live);
  }
);

export const selectAccountFillsLoading = createAppSelector(
  [selectRawFillsRest, selectRawParentSubaccount],
  mergeLoadableStatus
);

export const selectAccountTransfers = createAppSelector(
  [selectRawTransfersRestData, selectRawTransfersLiveData],
  (rest, live) => {
    return calculateTransfers(rest?.transfers, live);
  }
);

export const selectAccountTransfersLoading = createAppSelector(
  [selectRawTransfersRest, selectRawParentSubaccount],
  mergeLoadableStatus
);
