import { describe, expect, it } from 'vitest';

import { getVisibleData } from '@/lib/chart';

describe('getVisibleData', () => {
  it('finds an inclusive range in sorted chart data', () => {
    const data = [1, 2, 2, 3, 4].map((x) => ({ x }));

    expect(getVisibleData(data, ({ x }) => x, [2, 3])).toEqual(data.slice(1, 4));
    expect(getVisibleData(data, ({ x }) => x, [5, 6])).toEqual([]);
  });
});
