import { createAppSelector } from '@/state/appTypes';

import { calculateUserStats } from '../calculators/userStats';
import { selectRawAccountFeeTierData, selectRawAccountStatsData } from './base';

export const selectUserStats = createAppSelector(
  [selectRawAccountFeeTierData, selectRawAccountStatsData],
  (feeTier, stats) => calculateUserStats(feeTier, stats)
);
