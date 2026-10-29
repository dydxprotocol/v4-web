import type { Validator } from '@dydxprotocol/v4-proto/src/codegen/cosmos/staking/v1beta1/staking';
import { describe, expect, it } from 'vitest';

import { compareValidators, getValidatorWithFewestTokens } from '../useStakingValidator';

const validator = (
  operatorAddress: string,
  tokens: string,
  commission = '0',
  delegatorShares = '0'
) =>
  ({
    operatorAddress,
    tokens,
    delegatorShares,
    commission: { commissionRates: { rate: commission } },
  }) as Validator;

describe('getValidatorWithFewestTokens', () => {
  it('returns undefined when no validators are available', () => {
    expect(getValidatorWithFewestTokens([])).toBeUndefined();
  });

  it('selects the validator with the fewest tokens', () => {
    const validators = [validator('first', '20'), validator('second', '10')];

    expect(getValidatorWithFewestTokens(validators)).toBe(validators[1]);
  });
});

describe('compareValidators', () => {
  it('sorts by commission, then stake weight, and preserves equal values', () => {
    const highCommission = validator('high-commission', '0', '0.1', '100');
    const highStake = validator('high-stake', '0', '0.05', '200');
    const lowStake = validator('low-stake', '0', '0.050', '100');
    const equal = validator('equal', '0', '0.05', '100');

    expect([highCommission, lowStake, highStake].sort(compareValidators)).toEqual([
      highStake,
      lowStake,
      highCommission,
    ]);
    expect(compareValidators(lowStake, equal)).toBe(0);
  });
});
