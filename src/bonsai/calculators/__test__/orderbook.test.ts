import { describe, expect, it } from 'vitest';

import { calculateOrderbook } from '../orderbook';

describe('calculateOrderbook', () => {
  it('removes crossed levels according to their update offset', () => {
    const result = calculateOrderbook({
      asks: {
        '100': { size: '1', offset: 1 },
        '101': { size: '1', offset: 3 },
      },
      bids: {
        '102': { size: '1', offset: 2 },
        '99': { size: '1', offset: 1 },
      },
    });

    expect(result?.asks.map(({ price }) => price.toString())).toEqual(['101']);
    expect(result?.bids.map(({ price }) => price.toString())).toEqual(['99']);
  });
});
