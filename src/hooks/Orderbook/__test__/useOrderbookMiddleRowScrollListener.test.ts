import { describe, expect, it } from 'vitest';

import { getOrderbookDisplaySide } from '../useOrderbookMiddleRowScrollListener';

describe('getOrderbookDisplaySide', () => {
  it('identifies which side of the viewport hides the middle row', () => {
    expect(
      getOrderbookDisplaySide({
        clientHeight: 100,
        parentTop: 20,
        middleTop: 130,
        middleBottom: 150,
      })
    ).toBe('bottom');
    expect(
      getOrderbookDisplaySide({
        clientHeight: 100,
        parentTop: 20,
        middleTop: 10,
        middleBottom: 30,
      })
    ).toBe('top');
    expect(
      getOrderbookDisplaySide({
        clientHeight: 100,
        parentTop: 20,
        middleTop: 50,
        middleBottom: 70,
      })
    ).toBeUndefined();
  });
});
