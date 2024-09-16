import { describe, expect, it } from 'vitest';

import abacusStateManager from '..';
import { StatsigConfig } from '../../../constants/abacus';
import { StatSigFlags } from '../../../constants/statsig';

describe('setStatsigConfigs', () => {
  it('only sets properties that exist in the kotlin object', () => {
    abacusStateManager.setStatsigConfigs({
      [StatSigFlags.ff_enable_limit_close]: true, // TODO: make this a test flag in abacus
      // @ts-ignore
      nonexistent_flag: true,
    });
    expect(StatsigConfig.ff_enable_limit_close).toBe(true);
    // @ts-ignore
    expect(StatsigConfig.nonexistent_flag).toBeUndefined();
  });
});
