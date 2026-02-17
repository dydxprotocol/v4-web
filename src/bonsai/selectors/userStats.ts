import { createAppSelector } from '@/state/appTypes';

import { calculateUserStats } from '../calculators/userStats';
import {
  selectRawAccountFeeTierData,
  selectRawAccountStakingTierData,
  selectRawAccountStatsData,
} from './base';

export const selectUserStats = createAppSelector(
  [selectRawAccountFeeTierData, selectRawAccountStakingTierData, selectRawAccountStatsData],
  (feeTier, stakingTier, stats) => calculateUserStats(feeTier, stakingTier, stats)
);
