import { pick } from 'lodash';
import { shallowEqual } from 'react-redux';

import { createAppSelector } from '@/state/appTypes';

import {
  calculateMarketsNeededForSubaccount,
  calculateParentSubaccountPositions,
  calculateParentSubaccountSummary,
} from '../calculators/subaccount';
import { selectRawMarketsData, selectRawParentSubaccountData } from './base';

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
