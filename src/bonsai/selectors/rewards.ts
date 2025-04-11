import { createAppSelector } from '@/state/appTypes';

import { calculateRewardsSummary } from '../calculators/rewards';
import { selectRawRewardParams, selectRawRewardPrice } from './base';

export const selectRewardsSummary = createAppSelector(
  [selectRawRewardParams, selectRawRewardPrice],
  calculateRewardsSummary
);
