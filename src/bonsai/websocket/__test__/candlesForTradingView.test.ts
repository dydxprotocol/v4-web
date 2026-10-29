import { describe, expect, it } from 'vitest';

import type { IndexerWsCandleResponseObject } from '@/types/indexer/indexerManual';

import { getRealtimeCandles } from '../candlesForTradingView';

const candle = (startedAt: string) => ({ startedAt }) as IndexerWsCandleResponseObject;

describe('getRealtimeCandles', () => {
  it('forwards the latest candle from the initial websocket snapshot', () => {
    expect(getRealtimeCandles([candle('1'), candle('2')])).toEqual([candle('2')]);
  });

  it('forwards updates from the last seen candle onward', () => {
    expect(getRealtimeCandles([candle('1'), candle('2'), candle('3')], '2')).toEqual([
      candle('2'),
      candle('3'),
    ]);
  });
});
