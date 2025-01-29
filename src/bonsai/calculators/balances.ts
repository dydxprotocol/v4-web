import { Coin } from '@cosmjs/proto-signing';
import { keyBy } from 'lodash';
import { formatUnits } from 'viem';

import { TokenConfigsResult } from '@/hooks/useTokenConfigs';

import { AccountBalances } from '../types/summaryTypes';

function convertAmount(amount: string | undefined, decimals: number): string | undefined {
  if (amount == null) {
    return undefined;
  }
  return formatUnits(BigInt(amount), decimals);
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
