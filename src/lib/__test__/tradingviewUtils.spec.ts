import { ResolutionString } from 'public/tradingview/charting_library';
import { describe, expect, it } from 'vitest';

import { getBarTime } from '../tradingView/dydxfeed/utils';

describe('getBarTime', () => {
  it('should return the correct value when times start at 0', () => {
    const beginningOfChart = getBarTime(0, 0, '1' as ResolutionString);
    expect(beginningOfChart).toBe(0);

    const middleOfChart = getBarTime(0, 10001, '1' as ResolutionString);
    expect(middleOfChart).toBe(10);
  });

  it('should return the correct value when times dont start at 0', () => {
    // Intervals here look like 100, 1100, ... 9100, 10100, .etc
    // Should resolve to 9100ms bucket which is 9s
    const nonZeroStart = getBarTime(100, 10001, '1' as ResolutionString);
    expect(nonZeroStart).toBe(9);
  });

  it('should return correct value with real timestamps', () => {
    const timestampInSeconds = getBarTime(1716091200000, 1723573418524, '1D' as ResolutionString);
    expect(timestampInSeconds).toBe(1723521600);
  });
});
