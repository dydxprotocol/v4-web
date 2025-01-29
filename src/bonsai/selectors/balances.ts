import { selectTokenConfigs } from '@/hooks/useTokenConfigs';

import { createAppSelector } from '@/state/appTypes';

import { calculateBalances } from '../calculators/balances';
import { selectRawAccountBalancesData } from './base';

export const selectAccountBalances = createAppSelector(
  [selectTokenConfigs, selectRawAccountBalancesData],
  (configs, balances) => calculateBalances(configs, balances)
);
