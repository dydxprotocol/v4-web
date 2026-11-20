import { describe, expect, it } from 'vitest';

import { migration6 } from '../6';

describe('migration6', () => {
  it('resets the saved referrer', () => {
    const result = migration6({
      _persist: { version: 6, rehydrated: true },
      affiliates: { latestReferrer: 'dydx1referrer' },
    } as any);

    expect(result.affiliates.latestReferrer).toBeUndefined();
  });

  it('initializes affiliates when no prior state exists', () => {
    const result = migration6({ _persist: { version: -1, rehydrated: true } });

    expect(result.affiliates).toEqual({ latestReferrer: undefined });
  });
});
