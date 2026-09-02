import { describe, expect, it } from 'vitest';

import { mergeCandles } from '../candles';

type TestCandle = { startedAt: string; close: string };

const candle = (startedAt: string, close = startedAt): TestCandle => ({ startedAt, close });

describe('mergeCandles', () => {
  it('appends a new candle', () => {
    expect(mergeCandles([candle('1'), candle('2')], [candle('3')])).toEqual([
      candle('1'),
      candle('2'),
      candle('3'),
    ]);
  });

  it('replaces an existing candle', () => {
    expect(mergeCandles([candle('1'), candle('2')], [candle('2', 'updated')])).toEqual([
      candle('1'),
      candle('2', 'updated'),
    ]);
  });

  it('sorts and merges batched updates', () => {
    expect(
      mergeCandles(
        [candle('1'), candle('3'), candle('5')],
        [candle('4'), candle('2'), candle('3', 'updated')]
      )
    ).toEqual([candle('1'), candle('2'), candle('3', 'updated'), candle('4'), candle('5')]);
  });
});
