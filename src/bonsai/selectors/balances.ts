import { USDC_DECIMALS } from '@/constants/tokens';

import { selectTokenConfigs } from '@/hooks/useTokenConfigs';

import { createAppSelector } from '@/state/appTypes';

import { calculateBalances, convertAmount } from '../calculators/balances';
import { selectRawAccountBalancesData, selectRawAccountNobleUsdcBalanceData } from './base';

export const selectAccountBalances = createAppSelector(
  [selectTokenConfigs, selectRawAccountBalancesData],
  (configs, balances) => calculateBalances(configs, balances)
);

export const selectAccountNobleUsdcBalance = createAppSelector(
  [selectRawAccountNobleUsdcBalanceData],
  (balances) => convertAmount(balances?.amount, USDC_DECIMALS)
);
