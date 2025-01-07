import { EMPTY_ARR } from '@/constants/objects';

import { createAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { mergeLoadableStatus } from '../lib/mapLoadable';
import { selectRawFunding } from './base';

export const selectCurrentMarketFunding = createAppSelector(
  [selectRawFunding, getCurrentMarketId],
  (funding, marketId = '') => funding[marketId]?.data?.historicalFunding ?? EMPTY_ARR
);

export const selectCurrentMarketFundingLoading = createAppSelector(
  [selectRawFunding, getCurrentMarketId],
  (funding, marketId = '') => funding[marketId] && mergeLoadableStatus(funding[marketId])
);
