import { afterEach, describe, expect, it } from 'vitest';

import { V1State } from '../1';
import { migration2 } from '../2';

const V1_STATE: V1State = {
  _persist: { version: 1, rehydrated: true },
  wallet: {
    sourceAccount: {
      address: undefined,
      chain: undefined,
      encryptedSignature: undefined,
      walletInfo: undefined,
    },
  },
};

describe('migration2', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('should add hasSeenPredictionMarketIntroDialog property set to false', () => {
    const result = migration2(V1_STATE);
    expect(result.dismissable.hasSeenPredictionMarketIntroDialog).toBe(false);
  });

  it('should overwrite hasSeenPredictionMarketIntroDialog if it already exists', () => {
    const result = migration2(V1_STATE);
    expect(result.dismissable.hasSeenPredictionMarketIntroDialog).toBe(false);
  });

  it('should copy localStorage values to dismissable object', () => {
    localStorage.setItem('dydx.HasSeenPredictionMarketsIntro', 'true');

    const result = migration2(V1_STATE);

    expect(result.dismissable.hasSeenPredictionMarketIntroDialog).toBe(true);
    // Check if localStorage items were removed
    expect(localStorage.getItem('dydx.HasSeenPredictionMarketsIntro')).toBeNull();
  });
});
