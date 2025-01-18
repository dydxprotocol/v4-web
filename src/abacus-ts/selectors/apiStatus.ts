import { HeightResponse } from '@dydxprotocol/v4-client-js';

import { createAppSelector } from '@/state/appTypes';

import { computeApiState, getLatestSuccessfulHeight } from '../calculators/apiState';
import { selectRawIndexerHeightData, selectRawValidatorHeightData } from './base';

export const selectApiState = createAppSelector(
  [selectRawIndexerHeightData, selectRawValidatorHeightData],
  (indexerHeight, validatorHeight) => {
    return computeApiState({ indexerHeight, validatorHeight });
  }
);
export const selectLatestIndexerHeight = createAppSelector(
  [selectRawIndexerHeightData],
  (height): HeightResponse | undefined => getLatestSuccessfulHeight(height)
);

export const selectLatestValidatorHeight = createAppSelector(
  [selectRawValidatorHeightData],
  (height): HeightResponse | undefined => getLatestSuccessfulHeight(height)
);
