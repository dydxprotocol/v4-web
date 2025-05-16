import { HeightResponse } from '@dydxprotocol/v4-client-js';

import { ESTIMATED_BLOCK_TIME } from '@/constants/numbers';

import { type RootState } from '@/state/_store';
import { createAppSelector } from '@/state/appTypes';

import { computeApiState, getLatestHeight, getLatestHeightEntry } from '../calculators/apiState';
import { selectRawIndexerHeightData, selectRawValidatorHeightData } from './base';

export const selectApiState = createAppSelector(
  [selectRawIndexerHeightData, selectRawValidatorHeightData],
  (indexerHeight, validatorHeight) => {
    return computeApiState({ indexerHeight, validatorHeight });
  }
);
export const selectLatestIndexerHeight = createAppSelector(
  [selectRawIndexerHeightData],
  (height): HeightResponse | undefined => getLatestHeight(height)
);

export const selectLatestValidatorHeight = createAppSelector(
  [selectRawValidatorHeightData],
  (height): HeightResponse | undefined => getLatestHeight(height)
);

// not a selector since we use current time
// we return a very conservative estimate, aiming to return the smallest reasonable block height estimate
export const estimateLiveValidatorHeight = (state: RootState, biasMultiplier: number = 1.0) => {
  const latestEntry = getLatestHeightEntry(selectRawValidatorHeightData(state));
  const heightAtRequest = latestEntry?.response?.height;
  if (latestEntry == null || heightAtRequest == null) {
    return undefined;
  }
  // note: height response has time on it but we don't know if it's in sync with local system time so we can't use it
  const responseTime = new Date(latestEntry.receivedTime).getTime();
  const now = new Date().getTime();
  const elapsedTime = now - responseTime;

  const elapsedBlocksEst = Math.floor(elapsedTime / (ESTIMATED_BLOCK_TIME * biasMultiplier));
  return heightAtRequest + elapsedBlocksEst;
};
