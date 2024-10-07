import { describe, expect, it } from 'vitest';

import { isNewOrderPriceValid } from '../orderModification';

describe('isNewOrderPriceValid', () => {
  it('should return false if the new price is the same as the book price', () => {
    expect(isNewOrderPriceValid(2000, 1800, 2000)).toBe(false);
  });
  it('should return false if the new price crosses the book price', () => {
    expect(isNewOrderPriceValid(2000, 1800, 2100)).toBe(false);
    expect(isNewOrderPriceValid(2000, 2100, 1900)).toBe(false);
  });
  it('should return true for orders that remain on the same side', () => {
    expect(isNewOrderPriceValid(2000, 1800, 1900)).toBe(true);
    expect(isNewOrderPriceValid(2000, 1800, 1999.999)).toBe(true);
    expect(isNewOrderPriceValid(2000, 2100, 2001)).toBe(true);
  });
});
