import { describe, expect, it } from 'vitest';

import abacusStateManager from '..';
import { StatsigConfig } from '../../../constants/abacus';

describe('setStatsigConfigs', () => {
  it('does not set properties that do not exist in the kotlin object', () => {
    abacusStateManager.setStatsigConfigs({
      // @ts-ignore
      nonexistent_flag: true,
    });
    // @ts-ignore
    expect(StatsigConfig.nonexistent_flag).toBeUndefined();
  });
});
