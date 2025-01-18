import { HeightResponse } from '@dydxprotocol/v4-client-js';

import { createAppSelector } from '@/state/appTypes';

import { computeApiState, getLatestHeight } from '../calculators/apiState';
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
