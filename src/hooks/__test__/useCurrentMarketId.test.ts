import { describe, expect, it } from 'vitest';

import { DEFAULT_MARKETID } from '@/constants/markets';

import { getValidMarketId } from '../useCurrentMarketId';

describe('getValidMarketId', () => {
  it('revalidates a market when the available ids change', () => {
    expect(getValidMarketId(['ETH-USD', 'BTC-USD'], 'ETH-USD', 'BTC-USD')).toBe('ETH-USD');
    expect(getValidMarketId(['SOL-USD', 'DOGE-USD'], 'ETH-USD', 'BTC-USD')).toBe(DEFAULT_MARKETID);
  });

  it('uses the last viewed market while ids are loading', () => {
    expect(getValidMarketId([], undefined, 'SOL-USD')).toBe('SOL-USD');
  });
});
