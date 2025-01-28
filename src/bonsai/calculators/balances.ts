import { Coin } from '@cosmjs/proto-signing';
import BigNumber from 'bignumber.js';
import { keyBy } from 'lodash';

import { TokenConfigsResult } from '@/hooks/useTokenConfigs';

import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';

import { AccountBalances } from '../types/summaryTypes';

function convertAmount(amount: string | undefined, decimals: number): string | undefined {
  if (amount == null) {
    return undefined;
  }
  return MustBigNumber(amount)
    .div(BIG_NUMBERS.ONE.pow(decimals))
    .toFixed(10, BigNumber.ROUND_FLOOR);
}

export function calculateBalances(
  tokenConfig: TokenConfigsResult,
  balances: Coin[] | undefined
): AccountBalances {
  if (balances == null) {
    return {};
  }
  const byId = keyBy(balances, (b) => b.denom);
  const usdcBase = byId[tokenConfig.usdcDenom];
  const chainTokenBase = byId[tokenConfig.chainTokenDenom];

  return {
    usdcAmount: convertAmount(usdcBase?.amount, tokenConfig.usdcDecimals),
    chainTokenAmount: convertAmount(chainTokenBase?.amount, tokenConfig.chainTokenDecimals),
  };
}
